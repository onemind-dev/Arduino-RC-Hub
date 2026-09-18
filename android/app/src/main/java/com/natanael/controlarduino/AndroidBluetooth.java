package com.natanael.controlarduino;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(name = "AndroidBluetooth")
public class AndroidBluetooth extends Plugin {

    private BluetoothSocket socket;
    private OutputStream outputStream;

    private static final int REQUEST_BLUETOOTH = 1001;
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    // =========================================================
    // LISTAR DISPOSITIVOS DISPONIBLES
    // =========================================================
    @PluginMethod
    public void listarDispositivos(PluginCall call) {
        if (!validarPermisos(call)) return;

        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            call.reject("El Bluetooth está apagado o no disponible");
            return;
        }

        Set<BluetoothDevice> dispositivos = adapter.getBondedDevices();
        JSArray lista = new JSArray();

        if (dispositivos != null) {
            for (BluetoothDevice device : dispositivos) {
                JSObject devObj = new JSObject();
                devObj.put("name", device.getName() != null ? device.getName() : "Sin Nombre");
                devObj.put("address", device.getAddress());
                lista.put(devObj);
            }
        }

        JSObject resultado = new JSObject();
        resultado.put("dispositivos", lista);
        call.resolve(resultado);
    }

    // =========================================================
    // CONECTAR
    // =========================================================
    @PluginMethod
    public void conectar(PluginCall call) {

        if (!validarPermisos(call)) return;

        // Leer el parámetro pasado desde JS
        String targetBuscado = call.getString("dispositivo");

        if (targetBuscado == null || targetBuscado.trim().isEmpty()) {
            call.reject("Debes especificar el nombre o MAC del módulo Bluetooth");
            return;
        }

        targetBuscado = targetBuscado.trim();

        try {
            BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();

            if (adapter == null) {
                call.reject("Este teléfono no tiene hardware Bluetooth");
                return;
            }

            if (!adapter.isEnabled()) {
                call.reject("El Bluetooth está apagado");
                return;
            }

            Set<BluetoothDevice> dispositivos = adapter.getBondedDevices();

            if (dispositivos == null || dispositivos.isEmpty()) {
                call.reject("No hay dispositivos Bluetooth emparejados en Android");
                return;
            }

            BluetoothDevice objetivo = null;

            // BUSQUEDA DINÁMICA: por Dirección MAC o Nombre Exacto
            for (BluetoothDevice dispositivo : dispositivos) {
                String nombre = dispositivo.getName();
                String direccion = dispositivo.getAddress();

                // 1. Comparar por dirección MAC (Coincidencia infalible)
                if (direccion != null && direccion.equalsIgnoreCase(targetBuscado)) {
                    objetivo = dispositivo;
                    break;
                }

                // 2. Comparar por Nombre (Coincidencia exacta sin importar mayúsculas)
                if (nombre != null && nombre.equalsIgnoreCase(targetBuscado)) {
                    objetivo = dispositivo;
                    break;
                }
            }

            if (objetivo == null) {
                call.reject("Dispositivo '" + targetBuscado + "' no encontrado. Emparejalo desde los ajustes de Android primero.");
                return;
            }

            // Cerrar socket previo si existía
            if (socket != null) {
                try {
                    socket.close();
                } catch (Exception ignored) {}
                socket = null;
            }

            adapter.cancelDiscovery();

            socket = objetivo.createRfcommSocketToServiceRecord(SPP_UUID);
            socket.connect();

            outputStream = socket.getOutputStream();

            JSObject res = new JSObject();
            res.put("conectado", true);
            res.put("dispositivo", objetivo.getName());
            call.resolve(res);

        } catch (SecurityException e) {
            call.reject("Permiso Bluetooth denegado por el sistema");
        } catch (IOException e) {
            call.reject("Error de conexión con " + targetBuscado + ": " + e.getMessage());
        } catch (Exception e) {
            call.reject("Error inesperado: " + e.getMessage());
        }
    }

    // =========================================================
    // ENVIAR
    // =========================================================
    @PluginMethod
    public void enviar(PluginCall call) {
        String mensaje = call.getString("mensaje");

        if (mensaje == null || mensaje.isEmpty()) {
            call.reject("Mensaje vacío");
            return;
        }

        if (outputStream == null) {
            call.reject("Sin conexión activa con el módulo");
            return;
        }

        try {
            outputStream.write(mensaje.getBytes());
            outputStream.flush();
            call.resolve();
        } catch (IOException e) {
            call.reject("Error al transmitir datos por Bluetooth");
        }
    }

    // =========================================================
    // DESCONECTAR
    // =========================================================
    @PluginMethod
    public void desconectar(PluginCall call) {
        try {
            if (outputStream != null) {
                outputStream.close();
                outputStream = null;
            }
            if (socket != null) {
                socket.close();
                socket = null;
            }
            call.resolve();
        } catch (IOException e) {
            call.reject("Error al desconectar");
        }
    }

    // Helper para verificar permisos
    private boolean validarPermisos(PluginCall call) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            boolean connect = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
            boolean scan = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED;

            if (!connect || !scan) {
                ActivityCompat.requestPermissions(
                        getActivity(),
                        new String[]{Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN},
                        REQUEST_BLUETOOTH
                );
                call.reject("Debes conceder permisos de Bluetooth");
                return false;
            }
        }
        return true;
    }
}




