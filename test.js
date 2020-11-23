var test = require('tape');
var rational = require('./rational');
var tc = require('./index');


test('rational', function (t) {
  t.plan(13);

  t.equal(new rational.Rational(1,0).den, 0, 'toto');

  t.equal(rational.av_cmp_q(
    new rational.Rational(12, 135),
    new rational.Rational(120, 1350)
  ), 0);

  t.equal(rational.av_cmp_q(
    new rational.Rational(12, 34),
    new rational.Rational(23, 12)
  ), -1);

  t.equal(rational.av_cmp_q(
    new rational.Rational(102, 44),
    new rational.Rational(23, 12)
  ), 1);

  t.equal(rational.av_gcd(123, 246), 123);

  var a = new rational.Rational(-1, -1);

  rational.av_reduce(a, 123442143, 213432, Number.MAX_SAFE_INTEGER);

  t.equal(a.num, 41147381);
  t.equal(a.den, 71144);

   var b = new rational.Rational(123, 435);
   var c = new rational.Rational(34, 123);
   
   rational.av_mul_q(b, c);

   t.equal(b.num, 34);
   t.equal(b.den, 435);


   var b1 = new rational.Rational(12, 5);
   var c1 = new rational.Rational(2, 3);
   
   rational.av_div_q(b1, c1);

   t.equal(b1.num, 18);
   t.equal(b1.den, 5);

   var b2 = new rational.Rational(12, 5);
   var c2 = new rational.Rational(2, 3);
   
   rational.av_add_q(b2, c2);

   t.equal(b2.num, 46);
   t.equal(b2.den, 15);   
});


test('timecode', function (t) {
  t.plan(1);

  var tc0 = new tc.Timecode(
    0,
    new tc.Flags(false, true, false),
    new rational.Rational(25, 1),
    25
  );

  t.equal(tc0.av_timecode_make_string(120), "00:00:04:20", "tc0.av_timecode_make_string(120) = 00:00:04:20");
});


test('timecode with drop frame (29.97)', function (t) {
  t.plan(1);

  var tc0 = new tc.Timecode(
    0,
    new tc.Flags(true, true, false),
    new rational.Rational(30000, 1001),
    30
  );

  t.equal(tc0.av_timecode_make_string(120), "00:00:04;00", "tc0.av_timecode_make_string(120) = 00:00:04;00");
});


test('timecode with drop frame (59.94)', function (t) {
  t.plan(1);

  var tc0 = new tc.Timecode(
    0,
    new tc.Flags(true, true, false),
    new rational.Rational(60000, 1001),
    60
  );

  t.equal(tc0.av_timecode_make_string(120), "00:00:02;00", "tc0.av_timecode_make_string(120) = 00:00:02;00");
});


test('parse timcode from string @25', function (t) {
  t.plan(1);

  var tc0 = tc.parse(
    new rational.Rational(25, 1),
    "00:12:24:23"
  );

  t.equal(tc0.start, 18623, "tc.parse");
});


test('parse timcode from string @29.97', function (t) {
  t.plan(1);

  var tc0 = tc.parse(
    new rational.Rational(30000, 1001),
    "00:12:24;23"
  );

  t.equal(tc0.start, 22321, "tc.parse");
});


test('calcul1 @24000/1001', function (t) {
  t.plan(1);

  var images = Math.floor(1292.042 * (24000/1001));

  var tc0 = tc.parse(
    new rational.Rational(24000, 1001),
    "00:59:59:00"
  );

  t.equal(tc0.av_timecode_make_string(images), "01:21:29:17", "tc.av_timecode_make_string");
});