# Control por Voz para Carro Arduino 🚗🤖

Proyecto de un carro controlado por comandos de voz desde un dispositivo Android, utilizando Arduino y comunicación Bluetooth.

La aplicación fue desarrollada con tecnologías web y convertida en una aplicación Android mediante Capacitor y Android Studio. Está optimizada para funcionar en mi Samsung Galaxy A50.

Tecnologías utilizadas

* Frontend: HTML5, CSS3 y Vanilla JavaScript.
* Aplicación móvil: Capacitor + Android Studio.
* Hardware: Arduino, módulo Bluetooth HC-05 y driver L298N.
* Comunicación: Bluetooth Serial mediante comandos.

 Características

* 🎙️ Reconocimiento de comandos de voz.
* 📱 Aplicación Android.
* 🔵 Comunicación inalámbrica mediante Bluetooth.
* 🤖 Control de motores mediante Arduino.
* 🎮 Comandos para controlar el movimiento del carro.
* ⚡ Comunicación mediante caracteres de control (F, B, L, R).

¿Cómo funciona?

 Voz
   ↓
 Aplicación Android
   ↓
Bluetooth HC-05
   ↓
 Arduino
   ↓
 L298N
   ↓
Motores

La aplicación interpreta el comando de voz y envía el carácter correspondiente mediante Bluetooth. Arduino recibe el comando y controla los motores del carro.

# Comandos que envia
F => Adelante
B => Atras
L => Izquierda
R => Derecha
S => Detener

Proximamente añadire una seccion para personalizar los comandos sin tocar codigo

# Demo del proyecto:
 https://youtube.com/shorts/gUdiX8JQq24?si=wS4ORoV5nExN74DF

⸻

Proyecto desarrollado por onemind-dev. 
