document.addEventListener("DOMContentLoaded", () => {

    const estado = document.getElementById("Estado");
    const textoVoz = document.getElementById("Textovoz");

    // Variables de control de estado y comunicación
    let estaConectado = false;
    let ultimoComandoEnviado = "";
    let enviandoEnProceso = false;

    // Valores por defecto si localStorage está vacío o si un input queda en blanco
    const comandosDefectoBT = {
        adelante: "F",
        atras: "B",
        izquierda: "L",
        derecha: "R",
        detener: "S"
    };

    const instruccionesDefectoVoz = {
        adelante: "adelante",
        atras: "retrocede",
        izquierda: "izquierda",
        derecha: "derecha",
        detener: "alto"
    };

    // Cargar datos desde localStorage o usar valores por defecto
    function cargarConfiguracion() {
        const btGuardado = localStorage.getItem("rc_comandos_bt");
        const vozGuardada = localStorage.getItem("rc_instrucciones_voz");

        window.comandosBT = btGuardado ? JSON.parse(btGuardado) : { ...comandosDefectoBT };
        window.instruccionesVoz = vozGuardada ? JSON.parse(vozGuardada) : { ...instruccionesDefectoVoz };

        poblarInputs();
    }

    // Llenar los inputs de la vista de configuración
    function poblarInputs() {
        document.getElementById("cmd-adelante").value = window.comandosBT.adelante || comandosDefectoBT.adelante;
        document.getElementById("cmd-atras").value = window.comandosBT.atras || comandosDefectoBT.atras;
        document.getElementById("cmd-izquierda").value = window.comandosBT.izquierda || comandosDefectoBT.izquierda;
        document.getElementById("cmd-derecha").value = window.comandosBT.derecha || comandosDefectoBT.derecha;
        document.getElementById("cmd-detener").value = window.comandosBT.detener || comandosDefectoBT.detener;

        document.getElementById("voz-adelante").value = window.instruccionesVoz.adelante || instruccionesDefectoVoz.adelante;
        document.getElementById("voz-atras").value = window.instruccionesVoz.atras || instruccionesDefectoVoz.atras;
        document.getElementById("voz-izquierda").value = window.instruccionesVoz.izquierda || instruccionesDefectoVoz.izquierda;
        document.getElementById("voz-derecha").value = window.instruccionesVoz.derecha || instruccionesDefectoVoz.derecha;
        document.getElementById("voz-detener").value = window.instruccionesVoz.detener || instruccionesDefectoVoz.detener;
    }

    // Guardar comandos BT controlando que NO se guarden campos vacíos
    window.actualizarComandoBT = function(clave, valor) {
        const valorLimpio = valor ? valor.trim() : "";
        window.comandosBT[clave] = valorLimpio !== "" ? valorLimpio : comandosDefectoBT[clave];
        localStorage.setItem("rc_comandos_bt", JSON.stringify(window.comandosBT));
    };

    // Guardar instrucciones de voz controlando campos vacíos
    window.actualizarInstruccionVoz = function(clave, valor) {
        const valorLimpio = valor ? valor.trim().toLowerCase() : "";
        window.instruccionesVoz[clave] = valorLimpio !== "" ? valorLimpio : instruccionesDefectoVoz[clave];
        localStorage.setItem("rc_instrucciones_voz", JSON.stringify(window.instruccionesVoz));
    };

    // Inicializar configuración al cargar la app
    cargarConfiguracion();

    // Gestión del Panel de Configuración (Modal)
    const panelConfig = document.getElementById('configuracion');
    const btnAbrirConfig = document.getElementById('BtnConfig');
    const btnCerrarConfig = document.getElementById('CerrarConfig');

    if (btnAbrirConfig && btnCerrarConfig && panelConfig) {
        btnAbrirConfig.onclick = () => panelConfig.classList.remove('hidden');
        btnCerrarConfig.onclick = () => {
            panelConfig.classList.add('hidden');
            poblarInputs();
        };
    }

    // Obtener el plugin nativo de Capacitor
    function obtenerPluginBT() {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AndroidBluetooth) {
            return window.Capacitor.Plugins.AndroidBluetooth;
        }
        return null;
    }

    // Función principal para transmitir datos (Con Anti-Saturación y Control Async)
    async function enviarComando(letra, forzar = false) {
        const comandoAEnviar = letra || window.comandosBT.detener || comandosDefectoBT.detener;

        // 1. VALIDACIÓN DE CONEXIÓN
        if (!estaConectado) {
            if (estado) estado.textContent = "Error: Sin conexión Bluetooth";
            return;
        }

        // 2. EVITAR ENVÍOS DUPLICADOS
        if (!forzar && comandoAEnviar === ultimoComandoEnviado) {
            return;
        }

        // 3. SEMÁFORO DE ENVÍO (Evita colapsar la pila del plugin nativo)
        if (enviandoEnProceso) return;

        const Bluetooth = obtenerPluginBT();

        if (Bluetooth) {
            try {
                enviandoEnProceso = true;
                if (estado) estado.textContent = "Enviando: " + comandoAEnviar;
                await Bluetooth.enviar({ mensaje: comandoAEnviar });
                ultimoComandoEnviado = comandoAEnviar;
            } catch (error) {
                estaConectado = false;
                ultimoComandoEnviado = "";
                if (estado) estado.textContent = "Error de transmisión";
            } finally {
                enviandoEnProceso = false;
            }
        } else {
            if (estado) estado.textContent = "Plugin BT no disponible";
        }
    }

    // Helper de asignación de control de precisión
    const asignarControl = (idElemento, comandoGetter) => {
        const btn = document.getElementById(idElemento);
        if (!btn) return;

        // Iniciar movimiento al presionar
        const iniciarMovimiento = (e) => {
            e.preventDefault();
            enviarComando(comandoGetter());
        };

        // Detener movimiento al retirar, cancelar o deslizar el dedo fuera
        const detenerMovimiento = (e) => {
            e.preventDefault();
            if (estaConectado) {
                enviarComando(window.comandosBT.detener, true); // Forzar orden de PARAR
                if (estado) estado.textContent = "HC-05 CONECTADO";
            }
        };

        btn.onpointerdown = iniciarMovimiento;
        
        // Escucha todos los eventos táctiles posibles para asegurar el envío de la parada
        btn.onpointerup = detenerMovimiento;
        btn.onpointercancel = detenerMovimiento;
        btn.onpointerleave = detenerMovimiento;
    };

    // Asignar listeners a los botones de movimiento
    asignarControl("Adelante", () => window.comandosBT.adelante);
    asignarControl("Atras", () => window.comandosBT.atras);
    asignarControl("Izq", () => window.comandosBT.izquierda);
    asignarControl("Derecha", () => window.comandosBT.derecha);

    // Botón Parar
    const btnParar = document.getElementById("Parar");
    if (btnParar) {
        btnParar.onpointerdown = (e) => {
            e.preventDefault();
            enviarComando(window.comandosBT.detener, true);
        };
    }

    // Botón Conectar
    const btnConectar = document.getElementById("Conectar");
    if (btnConectar) {
        btnConectar.onclick = async () => {
            const Bluetooth = obtenerPluginBT();

            if (Bluetooth) {
                try {
                    if (estado) estado.textContent = "Conectando al HC-05...";
                    await Bluetooth.conectar();
                    estaConectado = true;
                    ultimoComandoEnviado = "";
                    if (estado) estado.textContent = "HC-05 CONECTADO";
                } catch (error) {
                    estaConectado = false;
                    if (estado) estado.textContent = "Error de conexión: " + (error.message || error);
                }
            } else {
                if (estado) estado.textContent = "Plugin Bluetooth no disponible";
            }
        };
    }

    // Botón Hablar (con reintento de fallback si el puente nativo tarda en cargar)
    const btnHablar = document.getElementById("Hablar");
    if (btnHablar) {
        btnHablar.onclick = () => {
            if (window.AndroidVoz && typeof window.AndroidVoz.abrirMicrofono === "function") {
                window.AndroidVoz.abrirMicrofono();
            } else {
                // Si la interfaz nativa aún no está lista, hace un segundo intento tras 300 ms
                setTimeout(() => {
                    if (window.AndroidVoz && typeof window.AndroidVoz.abrirMicrofono === "function") {
                        window.AndroidVoz.abrirMicrofono();
                    } else {
                        if (textoVoz) textoVoz.textContent = "Error: micrófono no listo";
                    }
                }, 300);
            }
        };
    }

    // Reconocimiento de voz nativo
    window.procesarVozNativa = function(texto) {
        if (!texto) return;
        if (textoVoz) textoVoz.textContent = "Dijiste: " + texto;
        const frase = texto.toLowerCase();

        const cmdAdelante = window.comandosBT.adelante || comandosDefectoBT.adelante;
        const cmdAtras = window.comandosBT.atras || comandosDefectoBT.atras;
        const cmdIzq = window.comandosBT.izquierda || comandosDefectoBT.izquierda;
        const cmdDer = window.comandosBT.derecha || comandosDefectoBT.derecha;
        const cmdDetener = window.comandosBT.detener || comandosDefectoBT.detener;

        const vozAdelante = window.instruccionesVoz.adelante || instruccionesDefectoVoz.adelante;
        const vozAtras = window.instruccionesVoz.atras || instruccionesDefectoVoz.atras;
        const vozIzq = window.instruccionesVoz.izquierda || instruccionesDefectoVoz.izquierda;
        const vozDer = window.instruccionesVoz.derecha || instruccionesDefectoVoz.derecha;
        const vozDetener = window.instruccionesVoz.detener || instruccionesDefectoVoz.detener;

        if (frase.includes(vozAdelante)) return enviarComando(cmdAdelante, true);
        if (frase.includes(vozAtras)) return enviarComando(cmdAtras, true);
        if (frase.includes(vozIzq)) return enviarComando(cmdIzq, true);
        if (frase.includes(vozDer)) return enviarComando(cmdDer, true);
        if (frase.includes(vozDetener)) return enviarComando(cmdDetener, true);

        if (textoVoz) textoVoz.textContent = "Comando no reconocido: " + texto;
    };
});