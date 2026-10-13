// AI Voice Command Module
// use the software serial port on the NyBoard to read the module. connect the module to the grove socket with pin 8 and 9.
// or use the serial 2 port on the BiBoard to read the module. connect the module to the pin Tx2 and Rx2.
// if you wire the module up with the USB programmer directly, connect the module's Tx to the programmer's Rx, and Rx to Tx.
// Jason Wang
// Petoi LLC
// Jun 25, 2026

#include <SoftwareSerial.h>
SoftwareSerial Serial2(8, 9);  //Rx, Tx

#define SERIAL2_BAUD_RATE 9600  // 9600 for Petoi AI Voice Module

void voiceAISetup() {
  PTLF("Init voice");
  Serial2.begin(SERIAL2_BAUD_RATE);
  Serial2.setTimeout(5);
}

void read_voice_AI() {
  if (Serial2.available()) {
    // serialDominateQ = true;
    token = Serial2.read();
    lowerToken = tolower(token);
    newCmdIdx = 2;
    delay(1);  //leave enough time for serial read

    char terminator = (token >= 'A' && token <= 'Z') ? '~' : '\n';  //capitalized tokens use binary encoding for long data commands
                                                                    //'~' ASCII code = 126; may introduce bug when the angle is 126 so only use angles <= 125
    long lastSerialTime = millis();
    int serialTimout = (token == T_SKILL_DATA || lowerToken == T_BEEP) ? SERIAL_TIMEOUT_LONG : SERIAL_TIMEOUT;
    do {
      if (Serial2.available()) {
        // long current = millis();
        // PTH("SR\t", current - lastSerialTime);
        do {
          if ((token == T_SKILL || lowerToken == T_INDEXED_SIMULTANEOUS_ASC || lowerToken == T_INDEXED_SEQUENTIAL_ASC) && cmdLen >= spaceAfterStoringData
              || cmdLen >= BUFF_LEN) {
            PTLF("OVF");
            delay(500);
            // beep(5, 100, 50, 5);
            do { Serial2.read(); } while (Serial2.available());
            PTL(token);
            token = T_SKILL;
            strcpy(newCmd, "up");
            // cmdLen = 2;  //not necessary
            return;
          }
          newCmd[cmdLen++] = Serial2.read();
        } while (Serial2.available());
        lastSerialTime = millis();
      }
    } while (newCmd[cmdLen - 1] != terminator
             && long(millis() - lastSerialTime) < serialTimout);  //the lower case tokens are encoded in ASCII and can be entered in Arduino IDE's serial monitor
                                                                  //if the terminator of the command is set to "no line ending" or "new line", parsing can be different
                                                                  //so it needs a timeout for the no line ending case
    // PTH("*SR\t", long(millis() - lastSerialTime));
    cmdLen = (newCmd[cmdLen - 1] == terminator) ? cmdLen - 1 : cmdLen;
    newCmd[cmdLen] = (token >= 'A' && token <= 'Z') ? '~' : '\0';

    //For debugging
    // PTLF("XZ RX");
    // PT(token);
    // PT(newCmd);
    // PTL();

#ifdef DEVELOPER
    PTF("Mem:");
    PTL(freeMemory());
#endif
    char *space = strchr(newCmd, ' ');
    int param = 0;
    if (space) {
      param = atoi(space + 1);
      cmdLen = space - newCmd;
      newCmd[cmdLen] = '\0';
    }
    char end = cmdLen > 0 ? newCmd[cmdLen - 1] : '\0';
    int delay = 2000;
    if ((end == 'F' || end == 'L' || end == 'R') && param > 0 && param <= 10)
      delay = 500 * param;
    tQueue->addTask(token, newCmd, delay);
    if (!strcmp(newCmd, "bk") || !strcmp(newCmd, "x") || (end >= 'A' && end <= 'Z') || end == 'x')
      tQueue->addTask('k', "up");
    newCmdIdx = 0;
  }
}
