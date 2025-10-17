#include <Arduino.h>

const uint8_t LED_PIN = LED_BUILTIN;
const uint8_t BUZZER_PIN = 9;
const uint8_t MOTOR_PIN = 5;

const unsigned long MOTOR_PULSE_MS = 150;
const unsigned long MOTOR_PAUSE_MS = 120;
const unsigned long LED_MIN_MS = 200;

char inputBuffer[96];
size_t inputIndex = 0;

void processLine(char *line);
void handleAlert(const char *kind, unsigned long durationMs, uint8_t intensity);

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(MOTOR_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);
  analogWrite(BUZZER_PIN, 0);
  analogWrite(MOTOR_PIN, 0);

  Serial.begin(115200);
  while (!Serial) {
    ;
  }
  Serial.println(F("READY"));
}

void loop() {
  while (Serial.available() > 0) {
    char c = Serial.read();

    if (c == '\r') {
      continue;
    }

    if (c == '\n') {
      inputBuffer[inputIndex] = '\0';
      if (inputIndex > 0) {
        processLine(inputBuffer);
      }
      inputIndex = 0;
    } else if (inputIndex < sizeof(inputBuffer) - 1) {
      inputBuffer[inputIndex++] = c;
    } else {
      // Buffer overflow, reset.
      inputIndex = 0;
      Serial.println(F("ERR overflow"));
    }
  }
}

void processLine(char *line) {
  char *command = strtok(line, " ");
  if (command == nullptr) {
    return;
  }

  if (strcmp(command, "ALERT") != 0) {
    Serial.println(F("ERR bad_cmd"));
    return;
  }

  char *kind = strtok(nullptr, " ");
  char *durationToken = strtok(nullptr, " ");
  char *intensityToken = strtok(nullptr, " ");

  if (kind == nullptr) {
    Serial.println(F("ERR no_kind"));
    return;
  }

  unsigned long durationMs = 500;
  if (durationToken != nullptr) {
    durationMs = strtoul(durationToken, nullptr, 10);
    if (durationMs == 0) {
      durationMs = 200;
    }
  }

  long rawIntensity = 255;
  if (intensityToken != nullptr) {
    rawIntensity = strtol(intensityToken, nullptr, 10);
  }

  if (rawIntensity < 0) {
    rawIntensity = 0;
  }
  if (rawIntensity > 255) {
    rawIntensity = 255;
  }

  handleAlert(kind, durationMs, static_cast<uint8_t>(rawIntensity));
  Serial.print(F("ACK "));
  Serial.println(kind);
}

void handleAlert(const char *kind, unsigned long durationMs, uint8_t intensity) {
  const bool buzzerActive = (strcmp(kind, "temp_high") == 0) || (strcmp(kind, "node_lost") == 0);
  const bool motorActive = (strcmp(kind, "node_lost") == 0);

  unsigned long start = millis();
  unsigned long ledEnd = start + max(durationMs, LED_MIN_MS);

  digitalWrite(LED_PIN, HIGH);

  if (buzzerActive) {
    analogWrite(BUZZER_PIN, intensity);
  } else {
    analogWrite(BUZZER_PIN, 0);
  }

  analogWrite(MOTOR_PIN, 0);
  unsigned long lastToggle = millis();
  bool motorOn = false;

  while (millis() - start < durationMs) {
    if (motorActive) {
      unsigned long now = millis();
      unsigned long interval = motorOn ? MOTOR_PULSE_MS : MOTOR_PAUSE_MS;
      if (now - lastToggle >= interval) {
        motorOn = !motorOn;
        analogWrite(MOTOR_PIN, motorOn ? intensity : 0);
        lastToggle = now;
      }
    }
    delay(10);
  }

  analogWrite(BUZZER_PIN, 0);
  analogWrite(MOTOR_PIN, 0);

  while (millis() < ledEnd) {
    delay(10);
  }

  digitalWrite(LED_PIN, LOW);
const uint8_t LED_PIN = 13;
const uint8_t BUZZER_PIN = 9;
const uint8_t MOTOR_PIN = 5;

struct AlertPayload {
  char kind[32];
  uint16_t durationMs;
  uint8_t intensity;
};

char inputBuffer[128];
size_t bufferIndex = 0;

void resetMotor() {
  analogWrite(MOTOR_PIN, 0);
}

void blinkLed(uint16_t millisOn) {
  digitalWrite(LED_PIN, HIGH);
  delay(millisOn);
  digitalWrite(LED_PIN, LOW);
}

void playBuzzer(uint16_t durationMs, uint8_t intensity, bool urgent) {
  const uint8_t duty = constrain(intensity, 0, 255);
  const uint16_t window = urgent ? 60 : 120;
  unsigned long start = millis();
  while (millis() - start < durationMs) {
    analogWrite(BUZZER_PIN, duty);
    delay(window);
    analogWrite(BUZZER_PIN, 0);
    delay(window);
  }
  analogWrite(BUZZER_PIN, 0);
}

void vibrateMotor(uint16_t durationMs, uint8_t intensity) {
  const uint16_t pulseWindowMs = 120;
  unsigned long start = millis();
  while (millis() - start < durationMs) {
    analogWrite(MOTOR_PIN, intensity);
    delay(pulseWindowMs / 2);
    resetMotor();
    delay(pulseWindowMs / 2);
  }
  resetMotor();
}

void processAlert(const AlertPayload &payload) {
  blinkLed(120);

  bool isTempHigh = strcmp(payload.kind, "temp_high") == 0;
  bool isNodeLost = strcmp(payload.kind, "node_lost") == 0;

  if (isTempHigh || isNodeLost) {
    playBuzzer(payload.durationMs, payload.intensity, isNodeLost);
  }

  if (isNodeLost) {
    vibrateMotor(payload.durationMs, payload.intensity);
  } else {
    resetMotor();
  }

  Serial.print(F("ACK:"));
  Serial.println(payload.kind);
}

bool parsePayload(const char *line, AlertPayload &payload) {
  payload.kind[0] = '\0';
  payload.durationMs = 500;
  payload.intensity = 200;

  char working[sizeof(inputBuffer)];
  strncpy(working, line, sizeof(working) - 1);
  working[sizeof(working) - 1] = '\0';

  char *token = strtok(working, ",");
  while (token != nullptr) {
    while (*token == ' ') {
      ++token;
    }

    if (strncmp(token, "kind=", 5) == 0) {
      strncpy(payload.kind, token + 5, sizeof(payload.kind) - 1);
      payload.kind[sizeof(payload.kind) - 1] = '\0';
    } else if (strncmp(token, "dur=", 4) == 0) {
      payload.durationMs = constrain(atoi(token + 4), 50, 5000);
    } else if (strncmp(token, "int=", 4) == 0) {
      payload.intensity = constrain(atoi(token + 4), 0, 255);
    }

    token = strtok(nullptr, ",");
  }

  return payload.kind[0] != '\0';
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(MOTOR_PIN, OUTPUT);
  resetMotor();
  digitalWrite(LED_PIN, LOW);

  Serial.begin(115200);
}

void loop() {
  while (Serial.available() > 0) {
    char incoming = Serial.read();
    if (incoming == '\r') {
      continue;
    }

    if (incoming == '\n') {
      inputBuffer[bufferIndex] = '\0';
      bufferIndex = 0;

      AlertPayload payload;
      if (parsePayload(inputBuffer, payload)) {
        processAlert(payload);
      } else {
        Serial.println(F("ERR:parse"));
      }
    } else if (bufferIndex < sizeof(inputBuffer) - 1) {
      inputBuffer[bufferIndex++] = incoming;
    } else {
      bufferIndex = 0;
      Serial.println(F("ERR:overflow"));
    }
  }
}
