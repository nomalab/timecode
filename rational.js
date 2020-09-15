/*
 * rational.js
 * https://github.com/FFmpeg/FFmpeg/blob/master/libavutil/rational.h
 * https://github.com/FFmpeg/FFmpeg/blob/master/libavutil/rational.c
 */


const INT_MIN = -2;

exports.INT_MIN = INT_MIN;

function FFABS(a) {
  return a >= 0 ? a : (-a);
}

exports.FFABS = FFABS;

function FFSIGN(a) {
  return a >= 0 ? 1 : (-1);
}

exports.FFSIGN = FFSIGN;

function FFMIN(a, b) {
  return a > b ? b : a;
}

exports. FFMIN = FFMIN;


class Rational {
   constructor(num, den) {
    this.num = num;
    this.den = den;
  }
}

exports.Rational = Rational;

/**
 * Compare two rationals.
 *
 * @param a First rational
 * @param b Second rational
 *
 * @return One of the following values:
 *         - 0 if `a == b`
 *         - 1 if `a > b`
 *         - -1 if `a < b`
 *         - `INT_MIN` if one of the values is of the form `0 / 0`
 */
function av_cmp_q(a, b) {
  if(a.num == 0 && a.den == 0 || b.num == 0 && b.den == 0) {
    return INT_MIN;
  } 

  const tmp = a.num * b.den - b.num * a.den;
  
  if(tmp > 0) {
    return 1;
  } else if (tmp < 0) {
    return -1;
  } else {
    return 0;
  }
}

exports.av_cmp_q = av_cmp_q;

/**
 * Convert an AVRational to a `double`.
 * @param a AVRational to convert
 * @return `a` in floating-point form
 * @see av_d2q()
 */
function av_q2d(a){
    return a.num / a.den;
}

exports.av_q2d = av_q2d;

function av_gcd(a, b) {
  if (!b) { return a; }
  return av_gcd(b, a % b);
}

exports.av_gcd = av_gcd;

/**
 * Reduce a fraction.
 *
 * This is useful for framerate calculations.
 *
 * @param[out] dst_num Destination numerator
 * @param[out] dst_den Destination denominator
 * @param[in]      num Source numerator
 * @param[in]      den Source denominator
 * @param[in]      max Maximum allowed values for `dst_num` & `dst_den`
 * @return 1 if the operation is exact, 0 otherwise
 */
function av_reduce(dst, num, den, max) {
  var a0 = new Rational(0,1);
  var a1 = new Rational(1,0);
  var sign = num < 0 ? (den < 0 ? 0 : 1) : (den > 0 ? 0 : 1);
  var gcd = av_gcd(FFABS(num), FFABS(den));

  if (gcd) {
    num = FFABS(num) / gcd;
    den = FFABS(den) / gcd;
  }
  if (num <= max && den <= max) {
    a1 = new Rational(num, den);
    den = 0;
  }

  while (den) {
    var x         = num / den;
    var next_den  = num - den * x;
    var a2n       = x * a1.num + a0.num;
    var a2d       = x * a1.den + a0.den;

    if (a2n > max || a2d > max) {
        if (a1.num) x =          (max - a0.num) / a1.num;
        if (a1.den) x = FFMIN(x, (max - a0.den) / a1.den);

        if (den * (2 * x * a1.den + a0.den) > num * a1.den)
            a1 = new Rational( x * a1.num + a0.num, x * a1.den + a0.den );
        break;
    }

    a0  = a1;
    a1  = new Rational( a2n, a2d );
    num = den;
    den = next_den;
  }

  dst.num = sign ? -a1.num : a1.num;
  dst.den = a1.den;
  return den == 0;
}

exports.av_reduce = av_reduce;


exports.av_mul_q = function(b, c) {
  av_reduce(b, b.num * c.num, b.den * c.den, Number.MAX_SAFE_INTEGER);
  return b;
}


exports.av_div_q = function(b, c) {
  return exports.av_mul_q(b, new Rational(c.den, c.num));
}


exports.av_add_q = function(b, c) {
  exports.av_reduce(b, b.num * c.den + c.num * b.den, b.den * c.den, Number.MAX_SAFE_INTEGER);
  return b;
}


exports.av_sub_q = function(b, c) {
  return exports.av_add_q(b, new Rational(-c.num, c.den));
}

