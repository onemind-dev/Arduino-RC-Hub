document.addEventListener("DOMContentLoaded", () => {

    const estado = document.getElementById("Estado");
    const textoVoz = document.getElementById("Textovoz");
    const btnHablar = document.getElementById("Hablar");

    let estaConectado = false;
    let ultimoComandoEnviado = "";
    let enviandoEnProceso = false;

    const moduloBTDefecto = "HC-05";

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

    function cargarConfiguracion() {
        const moduloGuardado = localStorage.getItem("rc_modulo_bt");
        const btGuardado = localStorage.getItem("rc_comandos_bt");
        const vozGuardada = localStorage.getItem("rc_instrucciones_voz");

        window.moduloBluetooth = (moduloGuardado && moduloGuardado.trim() !== "") ? moduloGuardado.trim() : moduloBTDefecto;
        window.comandosBT = btGuardado ? JSON.parse(btGuardado) : { ...comandosDefectoBT };
        window.instruccionesVoz = vozGuardada ? JSON.parse(vozGuardada) : { ...instruccionesDefectoVoz };

        poblarInputs();
    }

    function poblarInputs() {
        const inputModulo = document.getElementById("modulo-bt");
        if (inputModulo) inputModulo.value = window.moduloBluetooth;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal("cmd-adelante", window.comandosBT.adelante || comandosDefectoBT.adelante);
        setVal("cmd-atras", window.comandosBT.atras || comandosDefectoBT.atras);
        setVal("cmd-izquierda", window.comandosBT.izquierda || comandosDefectoBT.izquierda);
        setVal("cmd-derecha", window.comandosBT.derecha || comandosDefectoBT.derecha);
        setVal("cmd-detener", window.comandosBT.detener || comandosDefectoBT.detener);

        setVal("voz-adelante", window.instruccionesVoz.adelante || instruccionesDefectoVoz.adelante);
        setVal("voz-atras", window.instruccionesVoz.atras || instruccionesDefectoVoz.atras);
        setVal("voz-izquierda", window.instruccionesVoz.izquierda || instruccionesDefectoVoz.izquierda);
        setVal("voz-derecha", window.instruccionesVoz.derecha || instruccionesDefectoVoz.derecha);
        setVal("voz-detener", window.instruccionesVoz.detener || instruccionesDefectoVoz.detener);
    }

    const inputModuloBT = document.getElementById("modulo-bt");
    if (inputModuloBT) {
        inputModuloBT.addEventListener("input", (e) => {
            window.actualizarModuloBT(e.target.value);
        });
    }

    window.actualizarModuloBT = function(valor) {
        const valorLimpio = valor ? valor.trim() : "";
        window.moduloBluetooth = valorLimpio !== "" ? valorLimpio : moduloBTDefecto;
        localStorage.setItem("rc_modulo_bt", window.moduloBluetooth);
    };

    window.actualizarComandoBT = function(clave, valor) {
        const valorLimpio = valor ? valor.trim() : "";
        window.comandosBT[clave] = valorLimpio !== "" ? valorLimpio : comandosDefectoBT[clave];
        localStorage.setItem("rc_comandos_bt", JSON.stringify(window.comandosBT));
    };

    window.actualizarInstruccionVoz = function(clave, valor) {
        const valorLimpio = valor ? valor.trim().toLowerCase() : "";
        window.instruccionesVoz[clave] = valorLimpio !== "" ? valorLimpio : instruccionesDefectoVoz[clave];
        localStorage.setItem("rc_instrucciones_voz", JSON.stringify(window.instruccionesVoz));
    };

    cargarConfiguracion();

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

    function obtenerPluginBT() {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AndroidBluetooth) {
            return window.Capacitor.Plugins.AndroidBluetooth;
        }
        return null;
    }

    async function enviarComando(letra, forzar = false) {
        const comandoAEnviar = letra || window.comandosBT.detener || comandosDefectoBT.detener;

        if (!estaConectado) {
            if (estado) estado.textContent = "Error: Sin conexión Bluetooth";
            return;
        }

        if (!forzar && comandoAEnviar === ultimoComandoEnviado) {
            return;
        }

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

    const asignarControl = (idElemento, comandoGetter) => {
        const btn = document.getElementById(idElemento);
        if (!btn) return;

        const iniciarMovimiento = (e) => {
            e.preventDefault();
            enviarComando(comandoGetter());
        };

        const detenerMovimiento = (e) => {
            e.preventDefault();
            if (estaConectado) {
                enviarComando(window.comandosBT.detener, true);
                if (estado) estado.textContent = `${window.moduloBluetooth} CONECTADO`;
            }
        };

        btn.onpointerdown = iniciarMovimiento;
        btn.onpointerup = detenerMovimiento;
        btn.onpointercancel = detenerMovimiento;
        btn.onpointerleave = detenerMovimiento;
    };

    asignarControl("Adelante", () => window.comandosBT.adelante);
    asignarControl("Atras", () => window.comandosBT.atras);
    asignarControl("Izq", () => window.comandosBT.izquierda);
    asignarControl("Derecha", () => window.comandosBT.derecha);

    const btnParar = document.getElementById("Parar");
    if (btnParar) {
        btnParar.onpointerdown = (e) => {
            e.preventDefault();
            enviarComando(window.comandosBT.detener, true);
        };
    }

    const btnConectar = document.getElementById("Conectar");
    if (btnConectar) {
        btnConectar.onclick = async () => {
            const Bluetooth = obtenerPluginBT();

            if (Bluetooth) {
                try {
                    const inputElem = document.getElementById("modulo-bt");
                    if (inputElem && inputElem.value.trim() !== "") {
                        window.moduloBluetooth = inputElem.value.trim();
                        localStorage.setItem("rc_modulo_bt", window.moduloBluetooth);
                    }

                    const nombreModuloTarget = window.moduloBluetooth || moduloBTDefecto;

                    if (estado) estado.textContent = `Conectando a ${nombreModuloTarget}...`;
                    
                    await Bluetooth.conectar({ dispositivo: nombreModuloTarget });
                    
                    estaConectado = true;
                    ultimoComandoEnviado = "";
                    if (estado) estado.textContent = `${nombreModuloTarget} CONECTADO`;
                } catch (error) {
                    estaConectado = false;
                    
                    const mensajeError = (error && error.message) ? error.message : String(error);
                    const errorMinusculas = mensajeError.toLowerCase();

                    if (
                        errorMinusculas.includes("read failed") || 
                        errorMinusculas.includes("socket") || 
                        errorMinusculas.includes("timeout") ||
                        errorMinusculas.includes("closed")
                    ) {
                        if (estado) {
                            estado.textContent = `Error: Vincula '${window.moduloBluetooth}' en ajustes de tu teléfono primero`;
                        }
                    } else {
                        if (estado) {
                            estado.textContent = "Error: " + mensajeError;
                        }
                    }
                }
            } else {
                if (estado) estado.textContent = "Plugin BT no disponible";
            }
        };
    }

    // --- MANEJO DEL BOTÓN HABLAR (CAPACITOR + WEB FALLBACK) ---
    if (btnHablar) {
        btnHablar.onclick = async () => {
            const SpeechPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SpeechRecognition;

            if (SpeechPlugin) {
                try {
                    // Verificación de permisos corregida (plural en la API de Capacitor)
                    if (typeof SpeechPlugin.hasPermissions === 'function') {
                        const checkPerms = await SpeechPlugin.hasPermissions();
                        if (checkPerms.speechRecognition !== 'granted') {
                            await SpeechPlugin.requestPermissions();
                        }
                    }

                    if (textoVoz) textoVoz.textContent = "Escuchando...";
                    btnHablar.classList.add("escuchando");

                    const result = await SpeechPlugin.start({
                        language: "es-ES",
                        maxResults: 1,
                        prompt: "Di un comando",
                        partialResults: false,
                        popup: false
                    });

                    btnHablar.classList.remove("escuchando");

                    if (result && result.matches && result.matches.length > 0) {
                        window.procesarVozNativa(result.matches[0]);
                    }
                } catch (error) {
                    btnHablar.classList.remove("escuchando");
                    if (textoVoz) textoVoz.textContent = "Error de voz: " + (error.message || error);
                }
            } else {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const recognition = new SpeechRecognition();
                    recognition.lang = 'es-ES';

                    recognition.onstart = () => {
                        if (textoVoz) textoVoz.textContent = "Escuchando...";
                        btnHablar.classList.add("escuchando");
                    };

                    recognition.onresult = (event) => {
                        const comando = event.results[0][0].transcript;
                        window.procesarVozNativa(comando);
                    };

                    recognition.onerror = (e) => {
                        if (textoVoz) textoVoz.textContent = "Error: " + e.error;
                        btnHablar.classList.remove("escuchando");
                    };

                    recognition.onend = () => btnHablar.classList.remove("escuchando");

                    try { recognition.start(); } catch(e) { recognition.stop(); }
                } else {
                    if (textoVoz) textoVoz.textContent = "Voz no soportada en este dispositivo";
                }
            }
        };
    }

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