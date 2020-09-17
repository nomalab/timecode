/*
 * index.js
 * porting https://github.com/FFmpeg/FFmpeg/blob/master/libavutil/timecode.h
 * https://github.com/FFmpeg/FFmpeg/blob/master/libavutil/timecode.c
 */


/**
 * Adjust frame number for NTSC drop frame time code.
 *
 * @param framenum frame number to adjust (int)
 * @param fps      frame per second, 30 or 60 (int)
 * @return         adjusted frame number
 * @warning        adjustment is only valid in NTSC 29.97 and 59.94
 */
exports.av_timecode_adjust_ntsc_framenum2 = function(framenum, fps) {
  /* only works for NTSC 29.97 and 59.94 */
  var drop_frames = 0;
  var d, m, frames_per_10mins;

  if (fps == 30) {
    drop_frames = 2;
    frames_per_10mins = 17982;
  } else if (fps == 60) {
    drop_frames = 4;
    frames_per_10mins = 35964;
  } else {
    return framenum;
  }

  d = Math.floor(framenum / frames_per_10mins);
  m = framenum % frames_per_10mins;

  return framenum + 9 * drop_frames * d + drop_frames * Math.floor((m - drop_frames) / Math.floor(frames_per_10mins / 10));
};


exports.fps_from_frame_rate = function(rate) {
  if (!rate.den || !rate.num) {
    return -1;
  }  
  return Math.floor((rate.num + Math.floor(rate.den/2)) / rate.den);
};


exports.Flags = class Flags {
  constructor(dropframe, max24hours, allownegative) {
    ///< timecode is drop frame
    this.dropframe = dropframe;
    ///< timecode wraps after 24 hours
    this.max24hours = max24hours;
    ///< negative time values are allowed
    this.allownegative = allownegative;
  }
};


exports.Timecode = class Timecode {

  constructor(start, flags, rate) {
    ///< timecode frame start (first base frame number)
    this.start = start;
    ///< flags such as drop frame, +24 hours support, ...
    this.flags = flags;
    ///< frame rate in rational form
    this.rate = rate;
    ///< frame per second; must be consistent with the rate field
    this.fps = exports.fps_from_frame_rate(rate);
    console.log('this.fps', this.fps)
    return this.check_timecode();
  }

  /**
   * Load timecode string in buf.
   *
   * @param buf      destination buffer, must be at least AV_TIMECODE_STR_SIZE long
   * @param tc       timecode data correctly initialized
   * @param framenum frame number (int)
   * @return         the buf parameter
   *
   * @note Timecode representation can be a negative timecode and have more than
   *       24 hours, but will only be honored if the flags are correctly set.
   * @note The frame number is relative to tc->start.
   */
  av_timecode_make_string(framenum) {
    var rslt = this.make_array(framenum);
    var neg = rslt[0];
    var hh = rslt[1];
    var mm = rslt[2];
    var ss = rslt[3];
    var drop = rslt[4];
    var ff = rslt[5];
    return `${neg}${(hh+"").padStart(2, '0')}:${(mm+"").padStart(2, '0')}:${(ss+"").padStart(2, '0')}${drop}${(ff+"").padStart(2, '0')}`;
  }


  make_array(framenum) {
    var fps = this.fps;
    var drop = this.flags.dropframe;
    var hh, mm, ss, ff, neg = false;

    framenum += this.start;
    if (drop) {
      framenum = exports.av_timecode_adjust_ntsc_framenum2(framenum, fps);
    }
    if (framenum < 0) {
      framenum = -framenum;
      neg = this.flags.allownegative;
    }
    ff = framenum % fps;

    ss = Math.floor(framenum / fps)        % 60;
    mm = Math.floor(framenum / (fps*60))   % 60;
    hh = Math.floor(framenum / (fps*3600));
    if (this.flags.max24hours) {
      hh = hh % 24;
    }
    return [neg ? '-' : '', hh, mm, ss, drop ? ';' : ':', ff ];
  }

  check_fps() {
    var i;
    var supported_fps = [
      24, 25, 30, 48, 50, 60, 100, 120, 150
    ];

    for (i = 0; i < supported_fps.length; i++) {
      if (this.fps == supported_fps[i]) {
        return 0;
      }
    }
    return -1;
  }

  check_timecode(){
    if (this.fps <= 0) {
        console.log("Valid timecode frame rate must be specified. Minimum value is 1.");
        return 1;
    }
    if ((this.flags.dropframe) && this.fps != 30 && this.fps != 60) {
        console.log("Drop frame is only allowed with 30000/1001 or 60000/1001 FPS\n");
        return 2;
    }
    if (this.check_fps() < 0) {
        console.log("Using non-standard frame rate %d/%d", this.rate.num, this.rate.den);
    }
    return 0;
  }
};

/**
 * Parse timecode representation (hh:mm:ss[:;.]ff).
 *
 * @param log_ctx a pointer to an arbitrary struct of which the first field is a
 *                pointer to an AVClass struct (used for av_log).
 * @param tc      pointer to an allocated AVTimecode
 * @param rate    frame rate in rational form
 * @param str     timecode string which will determine the frame start
 * @return        0 on success, AVERROR otherwise
 */
exports.av_timecode_init_from_string = function(rate, str) {
  var c;
  var hh, mm, ss, ff, ret;

  var exp = /([0-9][0-9]):([0-9][0-9]):([0-9][0-9])([;:])([0-9]+)/;
  var match = str.match(exp);

  if(match) {
    hh = parseInt(match[1], 10);
    mm = parseInt(match[2], 10);
    ss = parseInt(match[3], 10);
    c = match[4];
    ff = parseInt(match[5]);
    var tc = new exports.Timecode(0, new exports.Flags(c != ':', true, false), rate);

    tc.start = (hh*3600 + mm*60 + ss) * tc.fps + ff;
    console.log('tc.fps', tc.fps)
    if (tc.flags.dropframe) { /* adjust frame number */
        var tmins = 60*hh + mm;
        tc.start -= (tc.fps == 30 ? 2 : 4) * (tmins - Math.floor(tmins/10));
    }
    return tc;
  } else {
    throw new Error("Invalid timecode string");
  }
}

/*
 * alias
 */
exports.parse = exports.av_timecode_init_from_string;

