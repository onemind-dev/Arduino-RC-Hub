package com.natanael.controlarduino;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognizerIntent;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private static final int REQUEST_CODE_SPEECH = 1000;
    private static final int REQUEST_CODE_PERMISOS = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AndroidBluetooth.class);
        super.onCreate(savedInstanceState);

        verificarYSolicitarPermisos();

        // Inicialización directa de la interfaz Javascript
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new WebAppInterface(), "AndroidVoz");
        }
    }

    private void verificarYSolicitarPermisos() {
        String[] permisos = {
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.BLUETOOTH_SCAN
        };

        boolean necesitaPermiso = false;
        for (String permiso : permisos) {
            if (ContextCompat.checkSelfPermission(this, permiso) != PackageManager.PERMISSION_GRANTED) {
                necesitaPermiso = true;
                break;
            }
        }

        if (necesitaPermiso) {
            ActivityCompat.requestPermissions(this, permisos, REQUEST_CODE_PERMISOS);
        }
    }

    public class WebAppInterface {
        @JavascriptInterface
        public void abrirMicrofono() {
            if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) 
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    MainActivity.this, 
                    new String[]{Manifest.permission.RECORD_AUDIO}, 
                    REQUEST_CODE_PERMISOS
                );
                return;
            }

            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Di un comando...");

            try {
                startActivityForResult(intent, REQUEST_CODE_SPEECH);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_CODE_SPEECH && resultCode == RESULT_OK && data != null) {
            ArrayList<String> result = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (result != null && !result.isEmpty()) {
                String texto = result.get(0).toLowerCase();
                
                // Envío seguro al hilo principal (UI Thread)
                new Handler(Looper.getMainLooper()).post(() -> {
                    WebView wv = bridge.getWebView();
                    if (wv != null) {
                        wv.evaluateJavascript("javascript:procesarVozNativa('" + texto + "')", null);
                    }
                });
            }
        }
    }
}