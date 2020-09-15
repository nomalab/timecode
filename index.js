/*
 * index.js
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
  constructor(start, flags, rate, fps) {
    ///< timecode frame start (first base frame number)
    this.start = start;
    ///< flags such as drop frame, +24 hours support, ...
    this.flags = flags;
    ///< frame rate in rational form
    this.rate = rate;
    ///< frame per second; must be consistent with the rate field
    this.fps = fps;
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
    return `${neg ? '-' : ''}${(hh+"").padStart(2, '0')}:${(mm+"").padStart(2, '0')}:${(ss+"").padStart(2, '0')}${drop ? ';' : ':'}${(ff+"").padStart(2, '0')}`;
  }
};

