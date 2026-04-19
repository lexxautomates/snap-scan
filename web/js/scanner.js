// Barcode scanner wrapping ZXing's BrowserMultiFormatReader.
// ZXing is loaded from CDN in index.html as a UMD bundle -> window.ZXing.
(function () {
  class Scanner {
    constructor(videoEl) {
      this.videoEl = videoEl;
      this.reader = null;
      this.controls = null;
      this.onResult = null;
      this.onError = null;
    }

    async start(onResult, onError) {
      this.onResult = onResult;
      this.onError = onError;
      const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = window.ZXing;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      this.reader = new BrowserMultiFormatReader(hints, 400);

      try {
        // Prefer rear camera on mobile
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d => d.kind === "videoinput");
        const rear = cams.find(d => /back|rear|environment/i.test(d.label)) || cams[cams.length - 1];
        const deviceId = rear ? rear.deviceId : undefined;

        this.controls = await this.reader.decodeFromVideoDevice(
          deviceId,
          this.videoEl,
          (result, err) => {
            if (result) this.onResult && this.onResult(result.getText());
            // ignore NotFoundException (no code in frame)
            if (err && err.name && err.name !== "NotFoundException" && this.onError) {
              this.onError(err);
            }
          }
        );
      } catch (e) {
        if (this.onError) this.onError(e);
        else throw e;
      }
    }

    stop() {
      if (this.controls) {
        try { this.controls.stop(); } catch (e) {}
        this.controls = null;
      }
      if (this.reader) {
        try { this.reader.reset(); } catch (e) {}
        this.reader = null;
      }
      const stream = this.videoEl && this.videoEl.srcObject;
      if (stream && stream.getTracks) stream.getTracks().forEach(t => t.stop());
      if (this.videoEl) this.videoEl.srcObject = null;
    }
  }

  window.Scanner = Scanner;
})();
