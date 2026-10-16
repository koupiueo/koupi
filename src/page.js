(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  function cssPx(name, d) {
    var n = parseFloat(getComputedStyle(root).getPropertyValue(name));
    return isNaN(n) ? d : n;
  }
  var FS = cssPx("--fs", 14), LH = cssPx("--lh", 22);
  var FONT = '"DVSM", "DejaVu Sans Mono", ui-monospace, monospace';
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var COL = { fg: "#c9d1d9", dim: "#6e7681", faint: "#3a404c", acc: "#38b6ff", pink: "#ff7b9c", grn: "#7ee787", yel: "#f2cc60", white: "#ffffff" };

  /* ================= clock ================= */
  var clock = $("clock");
  function tick() {
    try {
      var t = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }).format(new Date());
      clock.textContent = t + " JST";
    } catch (e) { clock.textContent = ""; }
  }
  tick(); setInterval(tick, 15000);

  /* ================= sections: type the command when it scrolls in ================= */
  var sections = Array.prototype.slice.call(document.querySelectorAll("section[data-scene]"));
  sections.forEach(function (s) {
    var ct = s.querySelector(".ct");
    if (!ct || reduce) return;
    ct.setAttribute("data-text", ct.textContent);
    ct.textContent = "";
    s.classList.add("pending");
  });
  function reveal(s) {
    if (s.getAttribute("data-done")) return;
    s.setAttribute("data-done", "1");
    var ct = s.querySelector(".ct");
    if (!ct || reduce) { s.classList.remove("pending"); return; }
    var full = ct.getAttribute("data-text") || "", i = 0;
    var lines = Array.prototype.slice.call(s.querySelectorAll(".out > *"));
    s.classList.add("typing");
    (function step() {
      if (i < full.length) { ct.textContent += full[i++]; setTimeout(step, 26 + Math.random() * 30); return; }
      s.classList.remove("typing");
      lines.forEach(function (l) { l.style.visibility = "hidden"; });
      s.classList.remove("pending");
      lines.forEach(function (l, k) { setTimeout(function () { l.style.visibility = ""; }, 70 + k * 45); });
    })();
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) reveal(e.target); });
    }, { rootMargin: "0px 0px -45% 0px", threshold: 0.01 });
    sections.forEach(function (s) { io.observe(s); });
  } else sections.forEach(reveal);
  reveal(sections[0]);

  /* ================= nav + active section ================= */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".bar-nav a"));
  function go(id) {
    var el = $(id);
    if (!el) return;
    reveal(el);
    el.scrollIntoView({ block: "start", behavior: "auto" });
  }
  navLinks.forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); go(a.getAttribute("data-go")); });
  });
  var activeId = "hello";
  function markNav(id) {
    navLinks.forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-go") === id); });
  }
  function probeY() {
    var barH = document.querySelector(".bar").getBoundingClientRect().bottom;
    return barH + (window.innerHeight - barH) * 0.35;
  }
  var scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      scrollQueued = false;
      var y = probeY(), cur = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= y) cur = sections[i];
      }
      // at the very bottom the last section wins
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = sections[sections.length - 1];
      if (cur.id !== activeId) {
        activeId = cur.id;
        var navId = cur.id === "shell" ? "contact" : cur.id;
        markNav(navId);
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  markNav("hello");

  /* terminal-style wheel scrolling: whole lines, no glide */
  var wheelAcc = 0;
  window.addEventListener("wheel", function (e) {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    var d = e.deltaY * (e.deltaMode === 1 ? LH : e.deltaMode === 2 ? window.innerHeight : 1);
    wheelAcc += d * 0.5;
    var n = wheelAcc > 0 ? Math.floor(wheelAcc / LH) : Math.ceil(wheelAcc / LH);
    if (n) {
      window.scrollTo(0, Math.max(0, Math.round((window.scrollY + n * LH) / LH) * LH));
      wheelAcc -= n * LH;
    }
  }, { passive: false });

  var TRACKS = [["Stress Relief", "late night drive home", "3:26"], ["Nope your too late i already died", "wifiskeleton, i wanna be a jack-o-lantern, suburban daredevil", "1:31"], ["Harvey", "Her's", "3:32"], ["it’s like i’m not even here", "mthu", "1:38"], ["unhappy", "s0rrow", "1:39"], ["Looking Out for You", "Joy Again", "3:00"], ["rhetorical", "duskydemise", "2:21"], ["im so blue for you", "zombiwebz", "2:14"], ["the sum of all our sirens", "Nelward", "5:46"], ["bedrott", "duskydemise", "1:54"]];
  var hoverTrack = -1;
  var JACK = ["d17171d77172ca7170cd7474ce696ad46e6de47779e5797ade7575c46463d87475d97073dc7274db7173d76c6ed87778e27371b45e5a7d38357a3839914b4ec46768de6e6fcb6565cb6867e07577d76a6dde7072e67778df7071e47474e47976b95e62af5e60bc6867bc6967bb686dad5b57d7716ee57a7adb706ed76c6ada6e6cdd7170db706ed9706de37a76e97e7ac06869c26668cc6c6cd17271d27372cc716fcb6f6dc86968c66b66d16969dd7373de7274d86b6ddd7475e07678e9817da15b59a65a5a9e5252ad6162b06464b06463bf6a6ac1696ac36d6bc26e6cb76160c4696bd37276b35e5e954a469a554c6e404174434777454a68383b6f3e426a3a3b844b4c8d494a8d504c854e4b7540407c43448a43477d4140743e3c6b3a374a272f391c1c60373a764448764245643130824645994b4d914846984e4e9c5257753e41834a4b9e5252b15f5ab86060b76666cb736fd87675dc7576d57272d37070d16f70cb6a6acc6c6bd26c6fbb6469622e2e3e1f1b9c504fcd685fd56b68b96464d7706ed76e6bd46d69d16d68d26f6cd0706fd1706ed56e6dd96f70c8656c5c2c2b6e3c3ab86161d6746ce37775653034af5b65b96066cf7072be6a697b413d4f2d2a572927c46365e17072d9747186484c8a4d4ae17677e27577e1737367373a884d509b5858b56666340f0a38231d301a1e49242c672b2de0797b9b5455341517391c1b6e3738d97674e172726e3d416c3b3b7f4643b16265451d1e4424263a2225412527743a39e178798a45466a3a385d342f743a3ace6e6ac96f6e804a5072474587514cbe696b7f3e42391817331314461c1aca7370e07270e37372e27271e67975e072739b4b455c2d2d7f474d7948486c3732c06967db7476c16a6bbc696ad97879e57474e77574e27271e47473e06f6cd36f716e36355f3231824d4e6e36367c474298504bd06f6cd46f6ddc7372dc7073dd6d74dd7375d36d6bd96d6de3716ea75755653538653a39804b4b7e46477f474a7f464798515286474a9f5759be6b6cb56265904c4a6f3731bb6167d46f72884a4672414477474b", "02010103000003000002000002000002000001000001000001000001000001000102000103000003000003000006010501010002000002000001000002000003000001000000000000000000000001000102000102000005020233340d1f1e0e0301000302030602030c0908242221242221161415231d070b0601030102010201020201160a00948a1bf3e729434415060200897c28342b0e22211d06050202040218110eba9e41aa8f3c140f03030401030201706325f8ed13b8a715151107120d04f2c95ce4c4531218000308000309001a1e00eec865f6ba79918731050401010200030400d8ce16f7ee1b1a1507433819f9c95beac770839e467eb43283b73aa5b454f2df69f7d841e7d92219130001020002040086801bc0b612bab02a4a4417f5e961fef8defbf4b3faec23faea22fef5d2fafefafdfadef5ea51574f12050101030101241f09c6b91dc2ba27898517f8f39efafbf7fff9d3f3ec34fbed28fefbe9fdfbfefcfefcfcf3abd4c22a0c0403060206514914e9dc271b1402bdb31df6e872fcf4caf8e768f2d81af8e81bf8f08dfffeebfdfceaf7ea87fcee1c4137071f1c06948c14e6da1877681f8e8d17faee14fded1cfbe90bf6e507f8e508f8ee17f4e31cf5e41dfaf30ff9ed133d3403444112d9d21aa8a01f1d17070c0900797117e4d81ffaee0ffeee02feec0dfbe723fef306faf104f2e806eddf0ccabe269488189a9014afa52c0504020200000602000c0800b8a61cfbeb09faea11f9e412f9e90af6ec0afdf507ede521251e036b6918757319372e0b020201020000060003070401c5b028f6e50aad9f106256096a610b837313b9ab0dece0241e1b040303000302050101020001000200000401010b0501cab720f2e506a9a021080302020000302605dbd026f3e31f362e05020000020001000000010101020000020101554e17cfbc26bfaf1ca49a2122210b020000211b08736a16877c162d2707020101010101000000010101020001020200070301060301050300050202000402020102040001020102030104010100020100010101010101010101", "10130f232924242c2c1019191c24200f16131117131014120f16131518151913150f150f0f15111015111214101115111c201b29302b2e39391d2a2a2d363111191413171253564d40473d60414d7d3c574d3042131310111410131413131714131812111a140d1818121e1f0e1711141b165d60595b5d4f757c6c8979797e3d528158666c625b372e2d653d501718171218131119140f1915111c192e332c8f828479726d7b775f878c7960534a9273756b6c5f76726e574a4b422932141a16111813111914121a15121c181d1a1a9a60786a4d4e66694c926c6962424058503c6b6a537066587e5c64585758101a14111812111914121a150d1b142e4339554437494a3a777d5d8162536653424b5a38595f44745c52502d2a1d251e101a14111811111913121a140f1c117c8e7a7a8375464f3f6e715a6462416b6c4c4051344a5d3b3a413011140d0e1915101a141118111119121119120d190a7f8e6d707f65526240546033595b3039391153613728331b0d140e101813101914101a1411181111191310181227332085946c5a6b4150643242542742492843451749502c13160f121813111914101a1411181311181211191511191439472a556531454d26454b25333d1c495228616a381d211212160c121712111914131c17151c171118131018151016133946276a7a47696f452f310f454c2e6c77463a432410160b10160d1318121d231f121914161d19111813101813141913444b31828b524d50213b3c20404621353a2210160b10170f1b221a444a451f242012181414191511181210190d15190f6b6a494e4f1d40401e36381a1b1d0b1213111014120f150f4850492e3430282d29171c18121713121915111a0d1e211365673d47472636391e1b1c0e14140e121413101512333933343a352f3430232723272a27121512131816121a105056354146281f241115190f1417161215141215143337332b302b282d291318141418141518151215121217142c32271b210d11160f121913151b16151a15121711131613111411161b17141814121713121713131613131613", "7b77656c695c827d6c99977ec3c3a2b0af90acab8ca9a78ac1c0a3bfba9cd5caacd0c1a6b9a99aa9998da59589a99a8689846b9c9983a9a58dbbb99bc3bfa0c7b79fbea290b59787b09183b19d8acfc2acc3b7a2bcb29eada291aa9d8ea58f81a09b80a7a488a59e82bcad94bba18fc5a199c69292e7c9bedacbbac8b6a5ded3bbddd3b5d8ceb4bfb69fb7ad95bda892c6bea3bfb79ac7b198c9ab9ae6dccbe0ccbeba8583e5cdbed7caaec9ba93d8cba8d7c8b0d3c6afcec2abd0c6adbba68ecfc4a8d6c8afdfd0b7e8ddc9e3d9c8d9cdb4d6c5a3d9c794d5c180cdbe75cbb882ddc6a7d9cbb3ccc2aacec6aecdbaa1cbbaa0d4c5aed7c6b0deccb6d4c199d0bf80dcc88ddac67fd7c179cdb779b79e6ab0976cbead8cd3c9accac3aad1bfa7d8c6addcceb6d7c8b1cbb98cd9c78bdac887dec98ddac87fd2bf77bba178947659987b59b9a472beae83c9bea1c2b296dbcbb1d8c9b1cbbb9ad3c186d8c382ceb977ddca8bdacb84dac885c4ab7cb2986ac7af7bd3bc7abca970dbc8a2dfceb1d5c6ace0d2b4c8b682d4bd78c5ac65d4bf87b5a580d3c48ddcca8fd5c181c5b07b9c896cb3a378b09c67c2a475d7c5a8dfceb4d8c3a0c8ae81c8ab69cbb06abead8e8c8375cabc92d9cc92cec083b2a1808c7e7185796bd4c2a3d1b896bdab8ed2c0a4bfa47ecfb399d6bc9bbda976c3b7a28e8778c7bc8ed2c98ecdc489a69c7d918775b7ac94dacdafd5c8acd5c4a8c3b194c3aa8ae0cdb3e1d1bcbaac91d1c3ae9e8e79d8ca92c0b177bfb47db7ab86cec29ed6caa9d0c4a4cabd9fcbba9fc6b398c8b69bcec2a6dad1b7d4c9b4e2d4bad8c69abeac6cbeab73b4a36cbaa980cfc195d2c1a1cfc2a3c7bc9ec0b096cdbaa6b6a894c0b59ed7d1b6c8bfa5c9b997baa568b7a26bb29f74beaa80bba7869b875da99564ab997ca8a0829b8b70bba798b7a999d1c4b2d3c9b1cabea2b8a680c0aa6db9a26cb0a16ec4b385c0ac81a48f65ac9868b09d7fb3a789a5957aad9b8eb4a898d2c7b5b9b098c2b89db0a17cb7a367bdaa6daea06ca69667a69662a69373c2b18fb8a786a79779a09078", "d8d5d3d7d5d3d9d6d5cdcac8cac7c56661615d5856524b4d554d485b51458b8578cdcbc5cecdcbd0cec9cbc6bfb6a997d8d8d0dad8d5e0dcdbd2cecdccc8c764605f655f5e6157575e4b3a684b35634c34887b72a8aa9b91987e7680586d7449d9dbd3dbdad7dcd8d7cdc9c8bdbbba6d6767776f6e746961928166836d56816d4f604e366f7d4d768c4e7e984e8c9a5bcccdc6b2b1a9b9b7b0aeaca68a8a837975718c85838b847bdfd5b5e0d3b2ded1ad8a81608a9a628c9c5f9caa6ba2ab71747c5c81876884896b7f85657f84608f8e7d9e98959a9490aaa191e5e1bab9b98d8f936b8a966184905b838e5a79844f7a85567b8658737f51727d4e7d86568e8d78aaa49fa2a1a2697883748d91677a69757e53717a4d6c76496e784a717b498792618591608a95658a9565899264919478aea7a3a9a8ae3e63793a678d4562716e7c5b646e45626a425a6139636b3e8e97648b95648a9363868e5d8b9364787c5caea9a6aca8ab47677d3b667e698a8859664e58603b5f67406d734d71774f8b9362838f5e727c4b6b7544677040696c4db8b4afb9afab8e8e9074797a3b423b4b513b5e65425962395157325f663e6f794b6773465e6c3e656f446a6b48817e66a7a094bbb0a9a99d9f736b6b464340504e46756b4e707c465f653b6a6e476c74497177516d754f606142998d7ea89e8d7a745e877d6b988f84706a644b48445d5b556a694d5d643a62644162643f888f6489906b888d698b9365767d516d6e5064624c686346746d565a53453f3b323f3f2e5f63435658395d5c3c5d603a73774e757d57767b547e87547d85577276536c6f516262456e684e8b856d7f7e5f6f714b5b5f3a50532d5759345e623b756e557f825d888764757455757355645f4489846a7f7c61716f547978567071466466425456314e512b565a35575b34887e6b7d7c5c767656817e677e795f8f8373b09f918681656669496666456360475e5d455b5b3b5659365a5e3a575c3884866d888e6b7886607175556c6b50786e59897b65888164827a5f6d614b867c6762594256583c5e624454583a5a5e43", "d6c2d1dfc8dbd6bfd3dfc8d9edd5e0f0d7e3f2d7e4f2d7e4f2d7e4f1d7e4f0d8e4f2d7e4f2d7e4f2d7e4f3d6e5efd9e7f3d4e6e6cae2edd2e9eed5e7f0d7e4f2d8e5f2d7e5f2d7e5f3d7e5f2d7e5f1d8e5f2d7e5f2d7e5f2d7e5f4d6e6f4d6e8f1d9e7f1d7e6f1d8e5f1d8e5f1d8e5f1d8e5f2d7e5f3d7e5f2d7e5f2d7e5f2d7e5f2d7e5f2d7e5f1d8e5f2d7e6f4d5e8f0d9e7f1d8e5f2d9e6f3d8e6f6d6e5f5d5e5f4d7e5f3d6e5f3d7e5f3d7e5f3d7e5f2d5e5f4d5e3f0cfdff4d4e5f5d5e8f1d9e7f2d8e5f1d6e3f4d5e4f5cfdfecc8d8eec7d7efc9d9edc7d7eec6daeec7dbefc8ddefcbdcf5d1e2eecadcf6d3e7f0d8e6f4d6e6f6d6e6edbdd0eec1d0f5d4dfe1b6c7e6c7d5f0d6e3f2d6e6f3d6e7eed3e3e3c8d6e9cbdaf1d4e4f0cde1f1d7e8f4d6e7f2d3e4ebc8dbe9c3d8eacadde4c0d4e8cadaeed6e5f2d6e7f2d7e7e7cdddf0d6e5f3d5e4e5c8d8ebccdff1d7e7f3d7e7f1d5e4edd4dfe5bfcee9c8d8e8c8d5f1d2e0e6ccdceed3e3e7ccdceed4e3f1d8e5f3d5e4ebccdcf1d3e5f1d7e6f1d7e8f0d6e6f2d7deebc9d6f0cfdff5d6dfe6c9d5e2c6d7e9ccddf2d5e3f1d4e3f0d7e4f4d5e4f1cbdef4d4e7f2d6e8f1d7e9f1d6e7f1d7dff1d7e1f2d7dff2d5e1e7ccd7ebcddee6c5d7f2cfdff1cdddf2d8e5f4d5e5f1cbdef5d5e6f2d6e8f2d7e8f1d7e6f1d8e0f1d9dbf2dcd5edd1dbedc8d8f3d0e2eecedef2d0e0f2cadcf4d2e3f2d4e3eecedef4d5e5f2d6e8f2d7e8f2d7e6f2d9def2dad8f2dad6f5d6e2f0cedeeecdddf2d5e4f4d4e4f6d5e4eec9daf0cedef2d5e3f3d5e5f2d7e8f2d7e8f2d7e6f2d9ddf2dbd4f2dad5ebc8daf0c4d8eccedcf1d6e3f6d7e7f6d2e3f0cbdcf2cddef6d9e7f4d6e6f1d7e6f2d7e7f2d7e7f2d7e3f2d8e0f2d8e2f3d5e5f0cdddf4d7e5f2d8e5f2d6e5e8c6d6f4caddf2ccddf1d5e4f3d6e6f0d9e5f2d7e6f2d7e6f2d7e6f2d7e6f2d7e6f2d7e6f2d7e4f2d7e4f2d7e4f1d6e3f2d5e3fad3e4f6d6e5f4d6e6f3d8e6eed9e4f1d7e5f2d7e5f2d7e5f2d7e5f2d7e5f2d7e4f2d7e3f2d7e3f2d7e3f2d7e3f1d6e2f2d8e3f0d8e3f2d7e4efd6e3", "e2e2e2ecececeeeeeef4f4f4f3f2f3efefeff5f4f4e9e9e9edebecfdfbfbfefdfefdfbfcfef9fbfbf8f9f6f7f7e1e2e2e7e7e7fbfbfbe8e8e8fcfcfcfdfcfdfdfcfdedebece9e7e8f1eeefe8e5e6fdfbfcede9ead9d3d5cbc6c8fcfcfceceeeeeaeaeaf9f9f9e8e8e8fdfdfdfdfdfdfbfafaf5f3f3ebe7e8eae4e5d3cecffbf8f8c8c2c3aca4a6cfc8cafcfcfcf8f9f9efefeffdfdfdd2d2d2fcfefdfcfcfcdcd9d9e9e2e3cdc3c5c0b3b5bdb2b4e5dfdfc5babbd3c1c5bdaeb1e7e2e2fcfcfbe4e4e4f8f8f8f4f4f4fdfdfde6e3e4c1b7b9c6b3b7e6d4d8bdafafcec3c2b9b0afc5b8b8a19192bfacaed7c9ccfcfbf9e6e6e6fafafaedededfdfcfcd6cbced1bfc4b7a1a6cebcc0eddfdfd5cac9c9bebee5dbdad5cac9d2c0c2ae9b9ffbf9f8f9f9f9f0f0f0dededefdf8faac959dd4bcc2bfaaaee3d5d6a89396c6b1b4d0c3c3b8a8aabca7aabda8acc0adb1f7f7f5f6f6f6fcfcfcebebebfcf7f8c6afb7b39fa5c6b4b7c4b4b5b8a2a5baa5a7e7dedecababdb89ea2bda6aaccbabef6f6f4fbfbfbfcfbfcedededfdfafbd5c6cbd8cbcec4b2b5b7a4a6967f82bcabadfef9f7bcb0b2b99fa3ccb5b8c4b2b6f3f2f0fafafaf9f9f9e8e8e8fbfcfcdaced2c5b7bcc6b0b7a8899196757eb29fa3a79a9c908486d6cac9bdadaed3bfc4e6e5e3fdfdfdf4f4f4dbdadafbf9faf7ecf1cec0c5b29da39a7d858f787eb4a2a6dfcfd2ada2a3cac1c2baabaeb09ba0dddbd9f0f0f0f7f7f7f4f3f4fdfbfcece0e4bba9afae9ba0e1d4d7d6c2c7c1b3b6e4d6d9c2b9bab7a9acd3c7c9ad9b9fe7e6e4e8e6e7f7f5f6f1eff0fffdfed8cdd1ae969d988a8cd0c0c3efe3e6baaeb0e9dfe1faf5f7bba8acece3e5d8d2d4e0dfdfe1dfe0f3f1f2e9e6e8fcfbfbf2eef0b5a5a9b1a8a9d5c7caecdde1aca0a2ebe2e4fffcfee3dcdde4dedffbfcfcf2f3f2e1dfdfeae9e9dbd8d9fbfbfcfbfcfcdcd5d6e9e5e5cfc1c4e0d0d4bdb5b6dcd5d6fefcfdf9f7f7d5d0d2fafdfdf6f7f7dfdfdfdcdcdcd9d8d8f3f2f3fcfcfdfcfcfcfdfbfcb9adb1e4d8dcddd9dac7c0c2fffbfde6e1e3cbc7c9f8f4f5e5e4e4", "555c62747b82a8c2cc9dadb4657175828689676366534d4f3a33350f0f0e0a0d0c292d2ca1a9a86b777f647987343e40444b5364666ca1c0c9b0dbe4a3cad47b8e946e747650595b3f484a1b2628131f222f3c408ea9ad74949a597883414b4c31384036373e7e92969aced6a6d4e691c2d77badc879aac75d8da25685935783914f798650767c54777e5d737b7071732029311d252c414f549bcdd6a1d7e89ccde492c0db77a5bf3d6b7e5984955e869950778a4a6b77445e6b5b7a844c5b5f191f25141e200e161a7aabb88cc5d356747e596c7692bbcf4f77854f68712d3e4530414a4a657442586a466c77405b60cbcec78b8b894a484b7da2b883b6ca5270775a726ea7d5e2668b9d54686f21313030404548647037556129515b36565ea5a69f938f8ca9a3a29dafbc76a1bb74a0ba8fbcd997b5d07a929f44626c4863712d48552f4d573857613158612b495565655f58575158524e6e7474a8c2d4b1cce2bcd4ec9a9ba7565358596a72536977415a643c5661415e693459632f4a564f504b55564f72736c889497a9cbe2b0cce5a3b6cf7f8da14e5c6947565e485964475d6848616d45616d32556030455047474542424145454469787e93bfd297bad08fa7be8896aa6472814e5d69455865455b67455c6845606c32535f3a4e5a6d6d6868615f5252527c919c99c0da89a8bc6e8ca1798c9f6b7c8b51636f4457634156644258673e59673c5d693d55616b6a62706c666f6f6d788a9180a3b78aa6ba6e8599576d7f5165754d6171485c6a455a65455b673d55603a535e37494f6969615a5a524545424c4f53798c9b7b96ac6a8396667c8f5c708256697c4b60703d545f384f583447502e3c45252e2d7979717b7b727874715a555559626a809fb5698a9e4f697d4554613f526444596b334d58354c5a353f4a272c2c3436327c7b737f7e767973705c5553636a708cabc17a9eb4698599222a306279876381904c697345556135363d3a3c3641423c807e7876756e73706c605a5871787e97b5ca86a7bc7391a66782966991a4587c8a546e78393f443f3b3c3e3e3b3a3b37", "f0f0edf3f4eff5f3eff5f4f0f4f2f0f0f1eeedefe8e9e9e5e6e4e0e1e1dce5e7dfe1e0d9e2e3dde4e5e0e5e5e1e3e4e0e7e6dee3e2dbe4e3dde4e2dde4e1dde3e2dceaebe2f4f1ecf6eff2f2efedf2efebf2f0ebf0f1ecf2f3eff2f3f0f2f2f0f1f0e9f2f1eaf3f1ebf4f1eaf0f4eef3f4e7e3d3bbbd9888dca98ee6c1a3fae7d5f6f2ebf3f2f0f3f2f0f2f3f0f2f3f0f4f5eef6f5eef7f5eef8f5eff5e9e0c39671b7743ba25122c15722bf4e15ce6b39e7b999f6f3e6f4f5ecf1f6f0f4f5f2f1f1ebf4f2ecf1f0eaf1ece7c0a095a46234aa5222af4e18bc5a1ac3521fc74b23c75225d9a379f8f2e8f5f6f4f7f7f5f2f3ecf4f3ecf0efe9e7dbd28054478f4e29b15425b44b19c6723ec87f54d9642ed0622e9a6f4addd0bff3f6f5f6f6f4f2f3ebf5f3edf1e9e2a6765f69422f6c412ca44f27af552db75d2fd48b4fd06a2cd37233dea561eaceb1f4f6eef6f6f3f1f1e9f3efe3b58b717547335c44316b4c41926c57cbb59fcb9561c37c3ba54e27a45926d9a157f2dfc3eff3ecf0f0edeff0e7f1e2da88674f594b3c93897a887b719e988eccc9bfccafa3c6a083b37a57d0ab8ae9d4c4f2eae3f1ede9eeeeeaebece3eeebe4dfdbd2c9c5bca7a597686356a49e916f665fb9ad9f6e6152e5d8cf746d58c8c1b8ece6e0f0ece7ecece8eff1e9efefe6eae7e1eae7dfdcd8cfb0aba3ccc7bfdcd5d3d2cdc25c574de6e0de8f8d7ea3a096f1eee6f3f1ebefefeaf0f2eaf2f1e9f2efeaf0ede7e1ded8e2dfdaeae7e2ece8e6e0ded746443dd1cecb9c9a8d6d665cf5f0e6f5f3ebf3f2eeefefe8f0f0e8f1f0eaf2f1ebf3f2ecf2efe9f1ede8f1ede8e9e5e0a29f97c9c6bdb7b2a855473cdbd1c7f4f3ecf2f4f0f0f1ecf3f2edf1f0ebf1f0ebf2f1ecf3f0ebf2efeaefece8f0ebe6f3efeaf1efebf2efe8f1eee4f6f3ebf3f2f0f1f2f1f6f6f3f5f4f0eeece8eeece8edebe7eeebe8f0edeaf1efebf1efebf0f0eeeeefedf1f3f0f3f5f0f3f4f0f4f4f3f7f7f6f8f8f7f3f1edecebe7eceae6eae8e4e9e7e3e9e7e3f0efebededeaefefede7e8e6eaece9e7e7e5e9e9e7f3f3f1f8f9f6", "e2e2e2e9e9e9e5e4e4b7b5b5b7b4b5ece7e8cac0bc6456538065648b6c667c4b45b4a199eae9e8e9e9e9f0f0f0efefeff0f0f0ecececdedcddc7c4c5afabacf0ebeba88e8e876969ac9a9da78d8fb9a49de9e7e2d5d5d5e7e7e7edededefefefe5e5e5ebebebcfcfcfc5c3c1868582ded9d6966e7279474aa18d8dcccac79f8d89f1edebbbbbbbbbbbbbededede9e9e9dfdfdfededede1e0e1d6d6d3c3c5c1e1e0dbd0b6b1622227ba9aa2d9d2d5bcb1ace1dad99e9e9ed0cfcfe7e6e6f1f0f0c6c6c6eaeaeae3e1e1c5c6c3d0d0cedcdcd9f2f1ebb68c91bda5a7b3a2a4805f63e2ced29c999ab3b0b1eae8e9f1eff0d1cfcee5e3e1bab8b6cdcccad3d3d1c5c4c3cfccccb6acacddd1d1ae979bc3b0b0e6e0dfa5a3a2bab8b7f1efedeeecebb1afaedcdad8a3a09db2b1acdedcd8b3a6a69b8b8cad9a9ccbc9c7bdb7b7d1cfcbc8cac6a4a2a0c9c6c5f2eeedbbb6b5aeaba9dbdadac7c3c4c5c1baa389856e373f9e7b7f633b42837a78857273b5acaccbc3c6bfbbbbbcb7b6e3dfdec8c1c1aea29fdad9daddd9dd926d677029266f1f24572729281110121109251110795960d2c4c9dfd9dadcd7d7dbd5d59b9595664e4ee0dedbb8a1a46725246c231f611b1d2f120e1b0f0a111007120e0d2013155e484abeb8b4e4e0ddc1bcb9a09a9a664347a195946c3b3e662320642f2c45221f22100f1a0d0a4b1b1c291016150e102313123a2826bdacac7e6a6cbdb7b57960609672756535366c282b522423261513301d20300e107227283f151611100b1d1310240d0d4a2b2f63454bded8d66a474a68373a7b54534f1f23210e0d181211240e134610136f211e54161324140e11140c16130d2214133b1c21d1cdca7051569a8884b7a6a023111013100f10110f311415682f2e6929277f4b4954323118100b19110e463d3aaca6a4aeadaad5c8cad7d1cd7d6d6b180c0a10100b271110611920661f217431369b7d78928681654d4f1e10119e9694b1afabd1cfcdf3f0efceccca2714163025232016104118187339385a1619632d2fa08882e1dcd6c4bdbb8a7d7fd0c9c9f0efedf2f1ef"];
  /* --- contact: links that lean toward the cursor --- */
  var LINKS = [
    { name: "discord", sub: "@koupier", copy: "koupier" },
    { name: "github", sub: "Koupi-dev", url: "https://github.com/Koupi-dev" },
    { name: "youtube", sub: "@koupi_dev", url: "https://www.youtube.com/@koupi_dev" },
    { name: "x", sub: "@koupicoupi", url: "https://x.com/koupicoupi" }
  ];
  var copyNote = $("copyNote");
  function copyText(s, cb) {
    function ok() { if (cb) cb(true); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, function () { if (cb) cb(false); });
    else {
      try { var ta = document.createElement("textarea"); ta.value = s; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); ok(); }
      catch (e) { if (cb) cb(false); }
    }
  }
  /* ================= stages: one live character-cell canvas per section ================= */
  function Stage(host, sceneName) {
  /* ================= character-cell canvas ================= */
  var cv = host.querySelector("canvas"), g = cv.getContext("2d"), cap = host.querySelector(".cap");
  var dpr = 1, W = 0, H = 0, CW = 8, CH = LH, cols = 40, rows = 20, ox = 0, oy = 0;
  var chars = [], fgc = [], bgc = [];
  var ptr = { x: -99, y: -99, inside: false, moved: 0, t: -1e9 };

  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var r = cv.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.font = FS + "px " + FONT; g.textBaseline = "middle"; g.textAlign = "left";
    CW = g.measureText("M").width || FS * 0.6;
    CH = LH;
    var nc = Math.max(12, Math.floor(W / CW)), nr = Math.max(6, Math.floor(H / CH));
    var changed = nc !== cols || nr !== rows;
    cols = nc; rows = nr;
    ox = Math.floor((W - cols * CW) / 2); oy = Math.floor((H - rows * CH) / 2);
    chars = new Array(cols * rows); fgc = new Array(cols * rows); bgc = new Array(cols * rows);
    newMask();
    if (changed && scene && scene.resize) scene.resize();
    if (changed && trans && trans.to && trans.to.resize && trans.to !== scene) trans.to.resize();
  }
  function clearBuf() {
    for (var i = 0; i < chars.length; i++) { chars[i] = ""; fgc[i] = ""; bgc[i] = ""; }
  }
  function put(x, y, ch, col, bg) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= cols || y >= rows || !ch || ch === " " && !bg) return;
    var i = y * cols + x;
    chars[i] = ch; fgc[i] = col || COL.fg; bgc[i] = bg || "";
  }
  function text(x, y, s, col, bg) { for (var i = 0; i < s.length; i++) put(x + i, y, s[i], col, bg); }
  function textC(y, s, col) { text(Math.floor((cols - s.length) / 2), y, s, col); }

  /* blocky dissolve between scenes */
  var STEPS = 7, STEP_MS = 70, mask = [];
  function newMask() { mask = new Array(cols * rows); for (var i = 0; i < mask.length; i++) mask[i] = Math.random(); }
  var scene = null, trans = null;

  function draw(filter) {
    g.clearRect(0, 0, W, H);
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var i = y * cols + x, ch = chars[i];
        if (!ch) continue;
        var f = filter ? filter(i) : 1;
        if (!f) continue;
        var px = ox + x * CW, py = oy + y * CH;
        if (bgc[i]) { g.fillStyle = f === 2 ? COL.white : bgc[i]; g.fillRect(px, py, Math.ceil(CW), CH); }
        g.fillStyle = f === 2 ? COL.white : fgc[i];
        if (ch !== " ") g.fillText(ch, px, py + CH / 2);
      }
    }
  }

  /* ---------- particle text helper ---------- */
  function targetsFor(lines, top, h, maxW) {
    var w = Math.min(maxW || cols, cols - 2);
    var oc = document.createElement("canvas"), sx = 4, sy = 8;
    oc.width = w * sx; oc.height = h * sy;
    var o = oc.getContext("2d");
    o.fillStyle = "#fff"; o.textAlign = "center"; o.textBaseline = "middle";
    var lineH = oc.height / lines.length, size = lineH * 0.92;
    o.font = "bold " + size + "px " + FONT;
    var widest = 0;
    lines.forEach(function (l) { widest = Math.max(widest, o.measureText(l).width); });
    if (widest > oc.width * 0.94) size *= (oc.width * 0.94) / widest;
    o.font = "bold " + size + "px " + FONT;
    lines.forEach(function (l, k) { o.fillText(l, oc.width / 2, lineH * (k + 0.5)); });
    var data = o.getImageData(0, 0, oc.width, oc.height).data, out = [];
    var x0 = Math.floor((cols - w) / 2);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var a = 0;
        for (var yy = 2; yy < sy; yy += 3) for (var xx = 1; xx < sx; xx += 2) a += data[((y * sy + yy) * oc.width + (x * sx + xx)) * 4 + 3];
        if (a / 6 > 110) out.push({ x: x0 + x, y: top + y });
      }
    }
    return out;
  }
  function Swarm(charset, opts) {
    this.p = []; this.set = charset; this.smooth = !!(opts && opts.smooth); this.time = 0; this.settledAt = 1e9;
  }
  Swarm.prototype.target = function (pts, colFn) {
    colFn = colFn || function (pt) { return pt.col || COL.acc; };
    var p = this.p, i;
    if (this.smooth) {
      var key = function (q) { return (q.hx !== undefined && q.home ? q.hx : q.x) * 1 + (q.hy !== undefined && q.home ? q.hy : q.y) * 2.2; };
      pts = pts.slice().sort(function (a, b) { return (a.x + a.y * 2.2) - (b.x + b.y * 2.2); });
      p.sort(function (a, b) { return key(a) - key(b); });
    } else pts = pts.slice().sort(function () { return Math.random() - 0.5; });
    while (p.length < pts.length) {
      var tp = this.smooth ? pts[p.length] : null;
      p.push({ x: tp ? tp.x + rnd(-6, 6) : rnd(0, cols), y: tp ? tp.y + rnd(-2, 2) : rnd(0, rows), vx: 0, vy: 0, hx: 0, hy: 0, ch: this.pick(), home: true, col: COL.fg });
    }
    this.settledAt = this.time + 1.7;
    for (i = 0; i < p.length; i++) {
      if (i < pts.length) {
        p[i].hx = pts[i].x; p[i].hy = pts[i].y; p[i].home = true; p[i].col = colFn(pts[i]);
        p[i].block = !!pts[i].block; p[i].fix = pts[i].ch || "";
        if (this.smooth) {
          var q = p[i];
          q.sx = q.x; q.sy = q.y; q.vx = 0; q.vy = 0;
          // sweep in from left to right, with a little randomness, along a soft arc
          q.tw = -((q.hx / Math.max(1, cols)) * 0.3 + rnd(0, 0.08)); q.dur = rnd(0.85, 1.0); q.arc = rnd(-0.6, 0.6);
        }
      }
      else if (this.smooth) { p[i].home = false; p[i].vx = rnd(-1, 1) * 6; p[i].vy = rnd(-0.4, 1) * 6; p[i].fade = 1; }
      else { p[i].home = false; p[i].vx += rnd(-1, 1) * 20; p[i].vy += rnd(-1, 1) * 10; }
    }
  };
  Swarm.prototype.pick = function () { return this.set[(Math.random() * this.set.length) | 0]; };
  Swarm.prototype.explode = function (cx, cy) {
    this.p.forEach(function (q) {
      var dx = q.x - cx, dy = (q.y - cy) * 2, d = Math.sqrt(dx * dx + dy * dy) + 0.5;
      q.vx += (dx / d) * rnd(30, 70); q.vy += (dy / d) * rnd(15, 35);
    });
  };
  Swarm.prototype.step = function (dt) {
    var p = this.p, keep = [];
    this.time += dt;
    for (var i = 0; i < p.length; i++) {
      var q = p[i];
      if (this.smooth && q.home && q.tw !== undefined && q.tw < q.dur) {
        q.tw += dt;
        var pr = clamp(q.tw / q.dur, 0, 1), e = 1 - Math.pow(1 - pr, 4);
        q.x = q.sx + (q.hx - q.sx) * e;
        q.y = q.sy + (q.hy - q.sy) * e + Math.sin(Math.PI * e) * q.arc;
        if (pr > 0.15 && pr < 0.7 && Math.random() < 0.12) q.ch = this.pick();
        keep.push(q); continue;
      }
      if (this.smooth && !q.home) { q.fade -= dt * 1.6; if (q.fade <= 0) continue; }
      if (this.smooth && q.home) {
        if (q.tw2 > 0) q.tw2 -= dt;
        else if (q.fix && Math.random() < dt * 0.25) { q.tw2 = rnd(0.12, 0.3); q.alt = SHADE_RAMP[clamp(SHADE_RAMP.indexOf(q.fix) + (Math.random() < 0.5 ? -1 : 1), 0, SHADE_RAMP.length - 1)] || q.fix; }
      }
      if (q.home) {
        q.vx += (q.hx - q.x) * 38 * dt; q.vy += (q.hy - q.y) * 38 * dt;
      }
      if (ptr.inside) {
        var dx = q.x - ptr.x, dy = (q.y - ptr.y) * 2, d2 = dx * dx + dy * dy;
        if (d2 < 36 && d2 > 0.01) { var d = Math.sqrt(d2), f = (6 - d) * 30 * dt; q.vx += (dx / d) * f; q.vy += (dy / d) * f * 0.5; }
      }
      q.vx *= Math.pow(0.02, dt); q.vy *= Math.pow(0.02, dt);
      q.x += q.vx * dt; q.y += q.vy * dt;
      var fast = Math.abs(q.vx) + Math.abs(q.vy) > 6;
      if (fast && Math.random() < 0.3) q.ch = this.pick();
      if (q.home || (q.x > -2 && q.x < cols + 2 && q.y > -2 && q.y < rows + 2)) keep.push(q);
    }
    this.p = keep;
  };
  Swarm.prototype.draw = function () {
    for (var i = 0; i < this.p.length; i++) {
      var q = this.p[i], near = q.home && Math.abs(q.x - q.hx) < 0.6 && Math.abs(q.y - q.hy) < 0.6;
      if (near && q.block) put(q.hx, q.hy, " ", q.col, q.col);
      else if (near && q.fix) put(q.hx, q.hy, this.smooth && q.tw2 > 0 ? q.alt : q.fix, q.col);
      else if (this.smooth) put(q.x, q.y, q.ch, q.home ? q.col : q.fade > 0.5 ? COL.dim : COL.faint);
      else put(q.x, q.y, q.ch, q.home ? (near ? q.col : q.block ? q.col : COL.fg) : COL.dim);
    }
    // once the shape has settled, a soft light sweeps across it now and then
    if (this.smooth && this.time > this.settledAt) {
      var sweep = ((this.time - this.settledAt) * 22) % (cols + rows * 2 + 40) - 6;
      for (var j = 0; j < this.p.length; j++) {
        var r = this.p[j];
        if (!r.home) continue;
        var dd = r.hx + r.hy * 2 - sweep;
        if (dd > -1.5 && dd < 1.5) put(r.hx, r.hy, r.fix || r.ch, dd > -0.5 && dd < 0.5 ? COL.white : "#e6edf3");
      }
    }
  };

  /* ================= scenes ================= */
  var S = {};

  /* --- hello: "koupi" made of characters, push it around --- */
  S.hello = (function () {
    var sw = new Swarm("koupi<3"), t = 0, heartY = 0;
    function build() {
      var h = Math.max(4, Math.min(Math.floor(rows * 0.45), Math.floor(cols / 3)));
      var top = Math.max(1, Math.floor((rows - h) / 2) - 2);
      sw.target(targetsFor(["koupi"], top, h), function () { return COL.acc; });
      heartY = top + h + 2;
    }
    return {
      cap: "",
      enter: function () { if (!sw.p.length) build(); else build(); },
      resize: build,
      update: function (dt) { t += dt; sw.step(dt); },
      draw: function () {
        sw.draw();
        var line = cols >= 30 ? "15y/o cat n music lover" : "cat n music lover";
        if (heartY < rows - 1) {
          var x = Math.floor((cols - line.length - 3) / 2);
          text(x, heartY, line, COL.fg);
          text(x + line.length + 1, heartY, "<3", Math.sin(t * 4) > -0.2 ? COL.pink : COL.faint);
        }
      },
      click: function (x, y) { sw.explode(x, y); },
      cursor: function () { return "crosshair"; }
    };
  })();

  /* --- tora: an ascii cat that chases your cursor, jumps for it, naps when ignored --- */
  S.tora = (function () {
    var SPR = {
      sit: [
        "  /\\_/\\  ",
        " ( o o ) ",
        "  > ^ <  ",
        " (\")_(\")~"
      ],
      runA: [
        "          /\\_/\\ ",
        " \\_______/ o o )",
        "  |  ___   __/  ",
        "  /_/   \\_\\     "
      ],
      runB: [
        "          /\\_/\\ ",
        " /_______/ o o )",
        "  |  ___   __/  ",
        "   \\_\\  /_/     "
      ],
      jump: [
        "           /\\_/\\ ",
        " ~~\\______/ o o )",
        "  //  ____  __/\\\\",
        " //            \\\\"
      ],
      sleep: [
        "              ",
        "   /\\_/\\____  ",
        "  ( - - )    )~",
        "   \"\"\"\"\"\"\"\"\"\"  "
      ]
    };
    var MIR = { "/": "\\", "\\": "/", "(": ")", ")": "(", "<": ">", ">": "<", "{": "}", "}": "{", "[": "]", "]": "[" };
    function mirror(lines) {
      return lines.map(function (l) { return l.split("").reverse().map(function (c) { return MIR[c] || c; }).join(""); });
    }
    var LEFT = {};
    Object.keys(SPR).forEach(function (k) { LEFT[k] = mirror(SPR[k]); });

    var G = 70;                       // gravity, rows / s^2
    var cat = { cx: 0, y: 0, vx: 0, vy: 0, face: 1, air: false, mode: "sit", anim: 0 };
    var t = 0, idle = 0, blink = 0, nextBlink = 3, happy = 0, hearts = [], jumpCd = 0, said = "", saidT = 0;
    var placed = false;
    var status = $("toraStatus");
    function setStatus(s) { if (status && status.textContent !== s) status.textContent = s; }
    function ground() { return rows - 2; }                 // last row the cat stands on
    function sprite() {
      var set = cat.face < 0 ? LEFT : SPR;
      if (cat.mode === "sleep") return set.sleep;
      if (cat.air) return set.jump;
      if (cat.mode === "run") return Math.floor(cat.anim) % 2 ? set.runB : set.runA;
      return set.sit;
    }
    function place() { cat.cx = cols / 2; cat.y = ground(); cat.vx = 0; cat.vy = 0; cat.air = false; placed = true; }
    function target() {
      // follow the pointer while it is over the panel, and keep going for a moment after a tap
      if (ptr.inside || performance.now() - ptr.t < 2500) return { x: ptr.x, y: ptr.y };
      return null;
    }
    return {
      cap: "try to catch him with your cursor.",
      enter: function () { if (!placed) place(); idle = 0; },
      resize: function () { cat.cx = clamp(cat.cx, 4, cols - 4); if (!cat.air) cat.y = ground(); },
      update: function (dt) {
        t += dt; saidT -= dt; jumpCd -= dt;
        if (happy > 0) happy -= dt;
        nextBlink -= dt;
        if (nextBlink < 0) { blink = 0.15; nextBlink = rnd(2.5, 6); }
        if (blink > 0) blink -= dt;
        var tg = target();
        if (ptr.moved > 0) { ptr.moved = 0; idle = 0; if (cat.mode === "sleep") { cat.mode = "sit"; said = "mrrp?"; saidT = 1.2; } }
        else idle += dt;

        var spr = sprite(), h = spr.length, top = cat.y - h + 1, halfW0 = spr[0].length / 2;
        if (cat.mode !== "sleep") {
          if (tg) {
            // keep a safe distance: come closer when the cursor is far, slip away when it reaches for him,
            // and hop right over it when he's cornered against a wall
            var dx = tg.x - cat.cx, adx = Math.abs(dx), level = tg.y > top - 3;
            var KEEP = 9, FAR = 16, want = 0;
            if (!cat.air) {
              if (level && adx < KEEP) {
                var away = dx > 0 ? -1 : 1;
                var room = away < 0 ? cat.cx - halfW0 : cols - halfW0 - cat.cx;
                if (room < 4 && jumpCd <= 0) {
                  // cornered: leap over the cursor to the other side
                  var hgt = Math.min(rows - 4, 6), airT = 2 * Math.sqrt(2 * hgt / G);
                  cat.vy = -Math.sqrt(2 * G * hgt);
                  cat.vx = clamp((dx + Math.sign(dx || 1) * (KEEP + 2)) / airT, -40, 40);
                  cat.air = true; jumpCd = 0.9; said = "!"; saidT = 0.6;
                } else want = away * Math.min(30, 14 + (KEEP - adx) * 3);
              } else if (adx > FAR) want = Math.sign(dx) * Math.min(22, 5 + (adx - FAR) * 1.4);
              cat.vx += (want - cat.vx) * Math.min(1, dt * (want ? 7 : 9));
              cat.mode = Math.abs(cat.vx) > 1.5 ? "run" : "sit";
              if (cat.mode === "run") cat.face = cat.vx > 0 ? 1 : -1;
              else if (adx > 1.5) cat.face = dx > 0 ? 1 : -1;
            }
          } else if (!cat.air) {
            cat.vx *= Math.pow(0.001, dt);
            cat.mode = Math.abs(cat.vx) > 1.5 ? "run" : "sit";
            if (idle > 10) { cat.mode = "sleep"; cat.vx = 0; }
          }
        }
        if (cat.air) {
          cat.vy += G * dt; cat.y += cat.vy * dt;
          if (cat.y >= ground()) { cat.y = ground(); cat.vy = 0; cat.air = false; cat.vx *= 0.5; }
        }
        cat.cx += cat.vx * dt;
        var halfW = sprite()[0].length / 2;
        if (cat.cx < halfW) { cat.cx = halfW; cat.vx = 0; }
        if (cat.cx > cols - halfW) { cat.cx = cols - halfW; cat.vx = 0; }
        cat.anim += Math.abs(cat.vx) * dt * 0.45;
        for (var i = hearts.length - 1; i >= 0; i--) {
          var hh = hearts[i]; hh.y -= dt * 3; hh.l -= dt;
          if (hh.l <= 0) hearts.splice(i, 1);
        }
        setStatus(cat.mode === "sleep" ? "sleeping" : cat.air ? "jumping!" : cat.mode === "run" ? "keeping his distance" : happy > 0 ? "happy" : "watching you");
      },
      draw: function () {
        // floor
        for (var x = 0; x < cols; x++) put(x, rows - 1, "_", COL.faint);
        var spr = sprite(), h = spr.length, w = spr[0].length;
        var x0 = Math.round(cat.cx - w / 2), y0 = Math.round(cat.y) - h + 1;
        var sitting = spr === SPR.sit || spr === LEFT.sit;
        var eyeShift = 0;
        if (sitting && ptr.inside) { var d = ptr.x - cat.cx; eyeShift = d < -4 ? -1 : d > 4 ? 1 : 0; }
        for (var r = 0; r < h; r++) {
          var line = spr[r];
          if (line.indexOf("o o") >= 0) {
            var e = blink > 0 ? "-" : happy > 0 ? "^" : "o";
            if (sitting && eyeShift) {
              var a = line.split(""), i0 = line.indexOf("o o");
              a[i0] = " "; a[i0 + 2] = " "; a[i0 + eyeShift] = e; a[i0 + 2 + eyeShift] = e;
              line = a.join("");
            } else line = line.replace("o o", e + " " + e);
          }
          for (var c = 0; c < line.length; c++) {
            var ch = line[c];
            if (ch === " ") continue;
            var col = ch === "o" || ch === "^" && r === 1 || ch === "-" && r === 2 && cat.mode === "sleep" ? COL.yel : COL.acc;
            put(x0 + c, y0 + r, ch, col);
          }
        }
        if (cat.mode === "sleep") {
          var zt = (t * 0.8) % 3;
          put(x0 + w - 1 + Math.floor(zt), y0 - Math.floor(zt), "z", COL.dim);
          put(x0 + w + Math.floor((zt + 1.5) % 3), y0 - Math.floor((zt + 1.5) % 3), "Z", COL.faint);
        }
        hearts.forEach(function (hh) { text(hh.x, hh.y, "<3", hh.l > 0.4 ? COL.pink : COL.faint); });
        if (saidT > 0) text(clamp(x0 + w - 2, 0, cols - said.length), y0 - 1, said, COL.fg);
      },
      pet: function () {
        idle = 0; happy = 1.4; said = "mrrp <3"; saidT = 1.4;
        if (cat.mode === "sleep") cat.mode = "sit";
        hearts.push({ x: cat.cx - 1, y: cat.y - 4, l: 1.4 });
      },
      click: function (x, y) {
        var spr = sprite(), w = spr[0].length, h = spr.length;
        var x0 = cat.cx - w / 2, y0 = cat.y - h + 1;
        if (x >= x0 - 1 && x <= x0 + w && y >= y0 - 1 && y <= cat.y + 0.5) this.pet();
      },
      cursor: function () { return "crosshair"; }
    };
  })();

  /* --- things: each thing gets its own picture, assembled out of flying characters --- */
  var PAL = {
    O: "#f0892a", D: "#c8641e", W: "#f4f1ea", K: "#ffffff", Y: "#ffc04a",
    G: "#62b043", g: "#4b8f30", h: "#7fcf55", B: "#8b5a2b", b: "#6a431f", l: "#a8743e"
  };
  var PIX = {
    // minecraft-style orange tropical fish
    "hamachill": [
      "......DDD.......",
      "....OOWWOOO...DD",
      "..OOOOWWOOOO.DDD",
      ".OKOOOWWOOOOODDD",
      "OOOOOOWWOOOOOOD.",
      "OOOOOOWWOOOOODDD",
      ".OOOOOWWOOOO.DDD",
      "...OOOWWOOO...DD",
      "......DDD......."
    ],
    // grass block
    "mc-plugins": [
      "GhGGGgGGhGGg",
      "GGgGhGGgGGhG",
      "gGGGGgGGGgGG",
      "BgBGBBgBBGBg",
      "BBBbBBBBlBBB",
      "BlBBBbBBBBbB",
      "BBBBBBlBBBBB",
      "bBBlBBBBbBBl",
      "BBBBbBBBBBBB",
      "BBlBBBBlBBbB",
      "BbBBBBbBBBBB",
      "BBBBlBBBBlBB"
    ]
  };
  var ASCII_CAT_BIG = [
    "       /\\_____/\\",
    "      /  o   o  \\",
    "     ( ==  ^  == )",
    "      )         (",
    "     (           )",
    "    ( (  )   (  ) )",
    "   (__(__)___(__)__)~~"
  ];
  var ASCII_CAT = [
    "    /\\_/\\",
    "   ( o.o )",
    "    > ^ <",
    "   /     \\",
    "  |       |",
    "   \\_____/ \\__"
  ];
  var PCH = { O: "@", D: "#", W: "+", K: "o", Y: "*", G: "#", g: "%", h: "*", B: "=", b: ":", l: "+" };
  var SHADE_RAMP = ".:-=+*#%@";
  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function tint(h, f, add) {
    var c = rgb(h); add = add || 0;
    return "#" + c.map(function (v) { v = clamp(Math.round(v * f + add), 0, 255); return (v < 16 ? "0" : "") + v.toString(16); }).join("");
  }
  // add a soft drop shadow one cell down-right of every filled cell
  function withShadow(pts) {
    var have = {}, out = [];
    pts.forEach(function (p) { have[p.x + "," + p.y] = 1; });
    pts.forEach(function (p) {
      var k = (p.x + 1) + "," + (p.y + 1);
      if (!have[k]) { have[k] = 1; out.push({ x: p.x + 1, y: p.y + 1, ch: ".", col: "#2b313b" }); }
    });
    return out.concat(pts);
  }
  function pixelTargets(art) {
    var w = art[0].length, h = art.length;
    var f = Math.min((cols - 2) / (2 * w), (rows - 3) / h);
    if (f >= 1) f = Math.floor(f);
    var ow = Math.max(1, Math.round(w * f)), oh = Math.max(1, Math.round(h * f));
    var x0 = Math.floor((cols - ow * 2) / 2), y0 = Math.max(0, Math.floor((rows - 1 - oh) / 2));
    var out = [];
    for (var y = 0; y < oh; y++) {
      for (var x = 0; x < ow; x++) {
        var c = art[Math.min(h - 1, Math.floor(y / f))][Math.min(w - 1, Math.floor(x / f))];
        if (c === ".") continue;
        var sx = Math.min(w - 1, Math.floor(x / f)), sy = Math.min(h - 1, Math.floor(y / f));
        var edge = sy === 0 || sx === 0 || sy === h - 1 || sx === w - 1 || art[sy - 1][sx] === "." || art[sy + 1][sx] === "." || art[sy][sx - 1] === "." || art[sy][sx + 1] === ".";
        // light from the top-left: brighter there, darker toward the bottom-right and on the outline
        var light = 1.22 - 0.42 * ((sx / w) * 0.5 + (sy / h) * 0.5) - (edge ? 0.12 : 0);
        var base = rgb(PAL[c]), lum = (0.3 * base[0] + 0.59 * base[1] + 0.11 * base[2]) / 255;
        for (var half = 0; half < 2; half++) {
          var n = lum * light + rnd(-0.07, 0.07) + (half ? -0.03 : 0.03);
          var ch = edge ? (half ? "#" : "%") : SHADE_RAMP[clamp(Math.floor(n * SHADE_RAMP.length), 2, SHADE_RAMP.length - 1)];
          if (c === "K") ch = "o";
          out.push({ x: x0 + x * 2 + half, y: y0 + y, col: tint(PAL[c], light), ch: ch });
        }
      }
    }
    return out;
  }
  function asciiTargets(lines) {
    var w = 0; lines.forEach(function (l) { w = Math.max(w, l.length); });
    var x0 = Math.floor((cols - w) / 2), y0 = Math.max(0, Math.floor((rows - 1 - lines.length) / 2)), out = [];
    lines.forEach(function (l, r) {
      for (var c = 0; c < l.length; c++) {
        if (l[c] === " ") continue;
        var k = (c / Math.max(1, w)) * 0.5 + (r / lines.length) * 0.5;
        out.push({ x: x0 + c, y: y0 + r, ch: l[c], col: l[c] === "o" ? COL.yel : tint(COL.acc, 1.25 - k * 0.55, k * 30) });
      }
    });
    return out;
  }
  S.things = (function () {
    var sw = new Swarm("abcdefghijklmnopqrstuvwxyz./-#", { smooth: true }), cur = "", label = "", shownLabel = "", lt = 0;
    var DESC = {
      "": "hover a thing above",
      "hamachill": "hamachill / a small private chat app",
      "mc-plugins": "mc-plugins / minecraft plugins, in java",
      "cat.koupi.dev": "cat.koupi.dev / a gallery of tora"
    };
    function build() {
      var pts;
      if (PIX[cur]) pts = pixelTargets(PIX[cur]);
      else if (cur === "cat.koupi.dev") pts = asciiTargets(cols >= 40 && rows >= 12 ? ASCII_CAT_BIG : ASCII_CAT);
      else {
        var h = Math.max(4, Math.min(rows - 4, Math.floor(rows * 0.6)));
        var top = Math.max(1, Math.floor((rows - h) / 2) - 1);
        pts = targetsFor(["things", "i made"], top, h);
        // a gradient from blue to green, denser characters in the middle of each stroke
        var hv = {}; pts.forEach(function (p) { hv[p.x + "," + p.y] = 1; });
        pts.forEach(function (p) {
          var inner = hv[(p.x - 1) + "," + p.y] && hv[(p.x + 1) + "," + p.y] && hv[p.x + "," + (p.y - 1)] && hv[p.x + "," + (p.y + 1)];
          var k = (p.y - top) / h;
          p.ch = inner ? (Math.random() < 0.5 ? "@" : "%") : (Math.random() < 0.5 ? "#" : "*");
          p.col = k < 0.5 ? tint(COL.acc, 1.15 - k * 0.5) : tint(COL.grn, 1.1 - (k - 0.5) * 0.5);
        });
      }
      sw.target(withShadow(pts));
      label = DESC[cur] || cur;
    }
    return {
      cap: "hover or tap a thing above.",
      enter: build,
      resize: build,
      set: function (name) { if (name === cur) return; cur = name; build(); },
      update: function (dt) {
        sw.step(dt);
        // the caption types itself out after the shape
        if (shownLabel !== label) { lt += dt; if (lt > 0.022) { lt = 0; shownLabel = label.indexOf(shownLabel) === 0 ? label.slice(0, shownLabel.length + 1) : ""; } }
      },
      draw: function () {
        sw.draw();
        var l = shownLabel.length > cols ? shownLabel.slice(0, cols) : shownLabel, sl = l.indexOf(" / ");
        var x = Math.floor((cols - label.length) / 2);
        if (sl < 0) text(x, rows - 1, l, COL.fg);
        else { text(x, rows - 1, l.slice(0, sl), COL.fg); text(x + sl, rows - 1, l.slice(sl), COL.dim); }
      },
      click: function (x, y) { sw.explode(x, y); },
      cursor: function () { return "crosshair"; }
    };
  })();

  /* --- music: the favourite playlist, each jacket redrawn as a tiny ascii mosaic --- */
  S.music = (function () {
    var RAMP = ".:-=+*#%@", cur = 0, t = 0, since = 0, from = -1, to = 0, mix = 1;
    var DATA = JACK.map(function (h) {
      var a = new Float32Array(768);
      for (var i = 0; i < 768; i++) a[i] = parseInt(h.substr(i * 2, 2), 16);
      return a;
    });
    // bilinear sample of the 16x16 jacket at fractional coords
    function sample(k, u, v, out) {
      var d = DATA[k];
      u = clamp(u, 0, 15); v = clamp(v, 0, 15);
      var x0 = Math.floor(u), y0 = Math.floor(v), x1 = Math.min(15, x0 + 1), y1 = Math.min(15, y0 + 1), fx = u - x0, fy = v - y0;
      for (var c = 0; c < 3; c++) {
        var a = d[(y0 * 16 + x0) * 3 + c], b = d[(y0 * 16 + x1) * 3 + c], e = d[(y1 * 16 + x0) * 3 + c], f = d[(y1 * 16 + x1) * 3 + c];
        out[c] = (a * (1 - fx) + b * fx) * (1 - fy) + (e * (1 - fx) + f * fx) * fy;
      }
    }
    function hex(c) { return "#" + [0, 1, 2].map(function (i) { var v = clamp(Math.round(c[i]), 0, 255); return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }
    function go(k) { if (k === to) return; from = to; to = k; mix = 0; }
    var A = [0, 0, 0], B = [0, 0, 0], C = [0, 0, 0];
    return {
      cap: "hover a song above. click here for the next one.",
      enter: function () {},
      update: function (dt) {
        t += dt; since += dt;
        if (hoverTrack >= 0 && hoverTrack !== cur) { cur = hoverTrack; since = 0; }
        else if (hoverTrack < 0 && since > 5) { cur = (cur + 1) % TRACKS.length; since = 0; }
        go(cur);
        mix = Math.min(1, mix + dt * 2.2);
      },
      draw: function () {
        var tr = TRACKS[to], wide = cols >= 52;
        var aspect = CH / CW;                                  // a cell is this many times taller than wide
        var gh = Math.max(4, wide ? rows - 1 : rows - 3);
        var gw = Math.round(gh * aspect);
        var maxW = wide ? Math.floor(cols * 0.55) : cols - 2;
        if (gw > maxW) { gw = maxW; gh = Math.max(3, Math.round(gw / aspect)); }
        var ax = wide ? Math.max(1, Math.floor(cols * 0.5) - gw - 1) : Math.floor((cols - gw) / 2);
        var ay = Math.max(0, Math.floor(((wide ? rows : rows - 2) - gh) / 2));
        var e = mix * mix * (3 - 2 * mix);                     // smoothstep cross-fade
        for (var y = 0; y < gh; y++) {
          for (var x = 0; x < gw; x++) {
            var u = (x + 0.5) * 16 / gw - 0.5, v = (y + 0.5) * 16 / gh - 0.5;
            sample(to, u, v, B);
            if (from >= 0 && e < 1) { sample(from, u, v, A); for (var c = 0; c < 3; c++) C[c] = A[c] + (B[c] - A[c]) * e; }
            else { C[0] = B[0]; C[1] = B[1]; C[2] = B[2]; }
            var lum = (0.3 * C[0] + 0.59 * C[1] + 0.11 * C[2]) / 255;
            var ch = RAMP[Math.min(RAMP.length - 1, Math.floor(lum * RAMP.length))];
            put(ax + x, ay + y, ch, hex([C[0] + 18, C[1] + 18, C[2] + 18]));
          }
        }
        var lines = [("0" + (to + 1)).slice(-2) + " / " + TRACKS.length, tr[0], tr[1], tr[2]];
        var cols4 = [COL.dim, COL.fg, COL.acc, COL.dim];
        if (wide) {
          var tx = ax + gw + 3, mw = cols - tx - 1, ty = ay + Math.floor(gh / 2) - 3;
          lines.forEach(function (l, i) {
            if (l.length > mw) l = l.slice(0, Math.max(1, mw - 1)) + "~";
            text(tx, ty + i + (i > 0 ? 1 : 0), l, cols4[i]);
          });
          var bw = Math.min(16, mw), fill = hoverTrack >= 0 ? bw : Math.round(bw * since / 5);
          for (var b = 0; b < bw; b++) put(tx + b, ty + 6, b < fill ? "=" : "-", b < fill ? COL.pink : COL.faint);
        } else {
          var l1 = tr[0] + "  " + tr[2], l2 = tr[1];
          if (l1.length > cols) l1 = l1.slice(0, cols - 1) + "~";
          if (l2.length > cols) l2 = l2.slice(0, cols - 1) + "~";
          textC(rows - 2, l1, COL.fg); textC(rows - 1, l2, COL.acc);
        }
      },
      click: function () { hoverTrack = -1; document.querySelectorAll(".tr.on").forEach(function (r) { r.classList.remove("on"); }); cur = (cur + 1) % TRACKS.length; since = 0; },
      cursor: function () { return "pointer"; }
    };
  })();

  S.contact = (function () {
    var items = [], toast = "", toastT = 0;
    function build() {
      var two = cols >= 34, boxW = 0;
      items = LINKS.map(function (l, k) {
        var label = "[ " + l.name + " ]";
        boxW = Math.max(boxW, label.length, l.sub.length);
        return { l: l, label: label, hx: 0, hy: 0, dx: 0, dy: 0 };
      });
      var gx = two ? 2 : 1, gy = two ? 2 : 4;
      var cellW = Math.floor(cols / gx), cellH = Math.max(3, Math.floor((rows - 2) / gy));
      items.forEach(function (it, k) {
        var cx = k % gx, cy = Math.floor(k / gx);
        it.hx = cx * cellW + Math.floor((cellW - it.label.length) / 2);
        it.hy = 1 + cy * cellH + Math.floor((cellH - 2) / 2);
      });
    }
    function hit(x, y) {
      for (var i = 0; i < items.length; i++) {
        var it = items[i], ix = Math.round(it.hx + it.dx), iy = Math.round(it.hy + it.dy);
        var w = Math.max(it.label.length, it.l.sub.length);
        if (x >= ix - 1 && x <= ix + w && y >= iy - 0.6 && y <= iy + 1.6) return it;
      }
      return null;
    }
    return {
      cap: "im friendly to everyone. feel free to send fq!",
      enter: build,
      resize: build,
      update: function (dt) {
        toastT -= dt;
        items.forEach(function (it) {
          var tx = 0, ty = 0;
          if (ptr.inside) {
            var cx = it.hx + it.label.length / 2, cy = it.hy + 0.5;
            var dx = ptr.x - cx, dy = (ptr.y - cy) * 2, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 14) { var f = (14 - d) / 14; tx = clamp(dx * 0.45 * f, -4, 4); ty = clamp(dy * 0.22 * f, -1.5, 1.5); }
          }
          it.dx += (tx - it.dx) * Math.min(1, dt * 10); it.dy += (ty - it.dy) * Math.min(1, dt * 10);
        });
      },
      draw: function () {
        var h = ptr.inside ? hit(ptr.x, ptr.y) : null;
        items.forEach(function (it) {
          var x = Math.round(it.hx + it.dx), y = Math.round(it.hy + it.dy);
          if (it === h) text(x, y, it.label, "#000", COL.acc);
          else text(x, y, it.label, COL.acc);
          text(x + Math.floor((it.label.length - it.l.sub.length) / 2), y + 1, it.l.sub, it === h ? COL.fg : COL.dim);
        });
        if (toastT > 0) textC(rows - 1, toast, COL.grn);
      },
      click: function (x, y) {
        var it = hit(x, y);
        if (!it) return;
        if (it.l.copy) {
          copyText(it.l.copy, function (ok) { toast = ok ? "copied: " + it.l.copy : "discord: " + it.l.sub; toastT = 2; });
        } else window.open(it.l.url, "_blank", "noopener");
      },
      cursor: function (x, y) { return hit(x, y) ? "pointer" : "default"; }
    };
  })();

  /* ================= scene switching ================= */
  function setScene(name, sectionId) {
    var next = S[name] || S.hello;
    cap.textContent = next.cap || "";
    if (trans && trans.to === next) return;
    if (!trans && scene === next) return;
    if (!scene || reduce) {
      scene = next; trans = null; if (next.enter) next.enter(); return;
    }
    newMask();
    var from = trans ? (trans.phase === "out" ? trans.from : trans.to) : scene;
    trans = { from: from, to: next, phase: "out", step: 0, acc: 0 };
  }

  /* ================= pointer ================= */
  function cellFromEvent(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left - ox) / CW - 0.5, y: (e.clientY - r.top - oy) / CH - 0.5 };
  }
  cv.addEventListener("pointermove", function (e) {
    var c = cellFromEvent(e);
    ptr.x = c.x; ptr.y = c.y; ptr.inside = true; ptr.moved++; ptr.t = performance.now();
    var s = trans ? null : scene;
    cv.style.cursor = s && s.cursor ? s.cursor(c.x, c.y) : "default";
  });
  cv.addEventListener("pointerleave", function () { ptr.inside = false; });
  cv.addEventListener("pointerdown", function (e) {
    var c = cellFromEvent(e);
    ptr.x = c.x; ptr.y = c.y; ptr.moved++; ptr.t = performance.now();
    if (e.pointerType !== "mouse") { ptr.inside = true; setTimeout(function () { ptr.inside = false; }, 450); }
    var s = trans ? (trans.phase === "in" ? trans.to : null) : scene;
    if (s && s.click) s.click(c.x, c.y);
  });

  /* ================= main loop ================= */
  function frame(dt) {
    clearBuf();
    if (trans) {
      trans.acc += dt * 1000;
      while (trans.acc >= STEP_MS) {
        trans.acc -= STEP_MS; trans.step++;
        if (trans.phase === "out" && trans.step >= STEPS) {
          trans.phase = "in"; trans.step = 0; newMask();
          if (trans.to.enter) trans.to.enter();
        } else if (trans.phase === "in" && trans.step >= STEPS) {
          scene = trans.to; trans = null; break;
        }
      }
    }
    if (trans) {
      var s = trans.phase === "out" ? trans.from : trans.to, k = trans.step / STEPS, k0 = (trans.step - 1) / STEPS;
      s.update(dt); s.draw();
      if (trans.phase === "out") draw(function (i) { var m = mask[i]; return m < k ? 0 : m < k + 1 / STEPS ? 2 : 1; });
      else draw(function (i) { var m = mask[i]; return m > k ? 0 : m > k0 ? 2 : 1; });
    } else if (scene) {
      scene.update(dt); scene.draw(); draw(null);
    }
  }

    layout();
    setScene(sceneName);
    var ro = "ResizeObserver" in window ? new ResizeObserver(function () { layout(); }) : null;
    if (ro) ro.observe(cv); else window.addEventListener("resize", layout);
    return { scene: S[sceneName], frame: frame, host: host, visible: true };
  }

  Array.prototype.slice.call(document.querySelectorAll("[data-track]")).forEach(function (row) {
    var i = +row.getAttribute("data-track");
    function on() { hoverTrack = i; document.querySelectorAll(".tr.on").forEach(function (r) { r.classList.remove("on"); }); row.classList.add("on"); }
    row.addEventListener("mouseenter", on); row.addEventListener("focus", on); row.addEventListener("click", on);
    row.addEventListener("mouseleave", function () { if (hoverTrack === i) { hoverTrack = -1; row.classList.remove("on"); } });
  });

  /* [info] pages are not up yet */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-info]");
    if (!a) return;
    e.preventDefault();
    var note = $("thingsNote"), was = "just stuff i make for fun. not a main, just curious :)";
    note.textContent = "// " + a.getAttribute("data-info") + " info page: coming soon :)";
    clearTimeout(note._t); note._t = setTimeout(function () { note.textContent = was; }, 2200);
  });

  /* things rows drive the things scene */
  Array.prototype.slice.call(document.querySelectorAll("[data-thing]")).forEach(function (row) {
    function on() {
      document.querySelectorAll("[data-thing].on").forEach(function (r) { r.classList.remove("on"); });
      row.classList.add("on");
      if (stages.things) stages.things.scene.set(row.getAttribute("data-thing"));
    }
    row.addEventListener("mouseenter", on);
    row.addEventListener("focus", on);
    row.addEventListener("click", function (e) { if (!e.target.closest("a")) on(); });
  });
  document.querySelectorAll("button.copy").forEach(function (b) {
    b.addEventListener("click", function () {
      copyText(b.getAttribute("data-copy"), function (ok) {
        copyNote.textContent = ok ? "// copied \"" + b.getAttribute("data-copy") + "\" :)" : "// discord: @koupier";
        setTimeout(function () { copyNote.textContent = "// click a value. discord copies the name."; }, 2200);
      });
    });
  });

  /* ================= shell ================= */
  var log = $("log"), form = $("sh"), input = $("cmd"), typed = $("typed"), ghost = $("ghost");
  var history = [], hIdx = 0;
  var PS1 = '<span class="ps1">koupi<span class="h">:~$</span></span> ';
  var NEOCAT = [
    "   /\\_____/\\",
    "  /  o   o  \\",
    " ( ==  ^  == )",
    "  )         (",
    " (           )",
    "( (  )   (  ) )",
    "(__(__)___(__)_)"
  ].join("\n");
  function line(html, cls) { var p = document.createElement("p"); if (cls) p.className = cls; p.innerHTML = html; log.appendChild(p); return p; }
  function outp(html, cls) { return line(html, "o" + (cls ? " " + cls : "")); }
  var FILES = {
    "about.txt": function () { outp("15y/o cat n music lover <span class=\"pink\">&lt;3</span>"); outp("learning design, english &amp; c++ right now.", "dim"); },
    "tora.txt": function () { outp("name    tora\nwhat    cat. brown tabby.\nstatus  " + esc($("toraStatus").textContent) + "\nphotos  <a href=\"https://cat.koupi.dev\" target=\"_blank\" rel=\"noopener\">cat.koupi.dev</a>"); },
    "music.txt": function () {
      outp("music &amp; cats. that's pretty much me.");
      outp("# my favorite playlist", "dim");
      TRACKS.forEach(function (t, i) { outp('<span class="dim">' + ("0" + (i + 1)).slice(-2) + "</span>  " + esc(t[0]) + '  <span class="dim">' + esc(t[1]) + "  " + t[2] + "</span>"); });
    },
    "contact.json": function () {
      outp('{\n  "discord": "@koupier",\n  "github":  <a href="https://github.com/Koupi-dev" target="_blank" rel="noopener">"Koupi-dev"</a>,\n  "youtube": <a href="https://www.youtube.com/@koupi_dev" target="_blank" rel="noopener">"@koupi_dev"</a>,\n  "x":       <a href="https://x.com/koupicoupi" target="_blank" rel="noopener">"@koupicoupi"</a>\n}');
    }
  };
  var CMDS = {
    help: { d: "this list", f: function () {
      var rows = [["whoami", "who's this"], ["tora", "go see tora"], ["pet", "pet tora"], ["things", "things i made"], ["music", "my favorite playlist"],
        ["contact", "where to find me"], ["ls", "list files"], ["cat <file>", "read a file"], ["neofetch", "my setup"], ["date", "time in japan"], ["clear", "clear this"]];
      outp('<span class="dim"># tab or -&gt; accepts the grey suggestion. up/down for history.</span>');
      rows.forEach(function (r) { outp('<span class="acc">' + (r[0] + "            ").slice(0, 12) + "</span>" + r[1]); });
    } },
    whoami: { f: function () { FILES["about.txt"](); } },
    tora: { f: function () { go("tora"); outp("tora: <span class=\"dim\">*looks at you*</span>"); } },
    pet: { f: function () {
      go("tora");
      setTimeout(function () { if (stages.tora) stages.tora.scene.pet(); }, 250);
      outp('tora: mrrp <span class="pink">&lt;3</span>');
    } },
    things: { f: function () { go("things"); listThings(); } },
    projects: { f: function () { go("things"); listThings(); } },
    music: { f: function () { go("music"); FILES["music.txt"](); } },
    contact: { f: function () { go("contact"); FILES["contact.json"](); } },
    hello: { f: function () { go("hello"); outp("hi :)"); } },
    ls: { f: function (a) {
      if (/^things(-i-made)?\/?$/.test(a)) return listThings();
      if (a) return outp("ls: " + esc(a) + ": No such file or directory", "err");
      outp('<span class="acc b">things-i-made/</span>  about.txt  tora.txt  music.txt  contact.json');
    } },
    cat: { f: function (a) {
      if (!a) return outp("cat: which file? try 'ls'", "dim");
      if (FILES[a]) return FILES[a]();
      if (/^things(-i-made)?\/?$/.test(a)) return outp("cat: " + esc(a) + ": Is a directory", "err");
      outp("cat: " + esc(a) + ": No such file or directory", "err");
    } },
    neofetch: { f: function () {
      var info = [["OS", "Debian (Xfce)"], ["GPU", "NVIDIA GeForce GTX 1660 SUPER"], ["Memory", "16 GB"], ["Cat", "Tora (brown tabby)"], ["Likes", "cats, music"], ["Uptime", "15 years"]];
      var right = '<span class="acc b">koupi</span>@<span class="acc b">koupi.dev</span>\n<span class="dim">----------------</span>\n' +
        info.map(function (r) { return '<span class="acc b">' + r[0] + ":</span> " + (r[0] + "        ").slice(r[0].length, 7) + r[1]; }).join("\n");
      var p = outp('<div class="neo"><pre>' + esc(NEOCAT) + "</pre><div>" + right + "</div></div>");
      p.style.whiteSpace = "normal";
      p.querySelector(".neo > div").style.whiteSpace = "pre-wrap";
    } },
    date: { f: function () {
      var s;
      try { s = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()); }
      catch (e) { s = new Date().toString(); }
      outp(esc(s) + " JST");
    } },
    echo: { f: function (a, raw) { outp(esc(raw.replace(/^\s*echo\s?/, ""))); } },
    clear: { f: function () { log.innerHTML = ""; return "cleared"; } },
    sudo: { f: function () { outp("nice try. tora is the admin here.", "err"); } },
    cd: { f: function () { outp("there's only ~ here :)", "dim"); } },
    exit: { f: function () { outp("logout... just kidding.", "dim"); } }
  };
  function listThings() {
    outp('<span class="acc b">hamachill/</span>      a small private chat app  <a href="#" data-info="hamachill">[info]</a>');
    outp('<span class="acc b">mc-plugins/</span>     minecraft plugins (java)  <a href="#" data-info="mc-plugins">[info]</a>');
    outp('<span class="acc b">cat.koupi.dev</span>   a gallery of tora         <a href="https://cat.koupi.dev" target="_blank" rel="noopener">[open]</a>');
  }
  var NAMES = Object.keys(CMDS);
  var SUGGEST = NAMES.concat(["cat about.txt", "cat tora.txt", "cat music.txt", "cat contact.json", "ls things-i-made/"]);
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function suggestion() {
    var v = input.value;
    if (!v.trim()) return "";
    var lv = v.toLowerCase(), pool = history.slice().reverse().concat(SUGGEST);
    for (var i = 0; i < pool.length; i++) {
      var c = pool[i];
      if (c.length > v.length && c.toLowerCase().indexOf(lv) === 0) return c.slice(v.length);
    }
    return "";
  }
  function sync() { typed.textContent = input.value; ghost.textContent = suggestion(); }
  function acceptGhost() { var gst = suggestion(); if (!gst) return false; input.value += gst; sync(); return true; }
  function run(raw) {
    var p = line(PS1, "gap"); var sp = document.createElement("span"); sp.textContent = raw; p.appendChild(sp);
    var v = raw.trim();
    if (v) { history.push(v); }
    hIdx = history.length;
    if (v) {
      var parts = v.split(/\s+/), name = parts[0].toLowerCase(), arg = parts.slice(1).join(" ");
      var c = CMDS[name];
      if (c) { if (c.f(arg, v) === "cleared") { } }
      else {
        var best = null, bd = 9;
        NAMES.forEach(function (n) { var d = lev(name, n); if (d < bd) { bd = d; best = n; } });
        if (best && bd <= 2) {
          var q = outp('command not found: ' + esc(name) + '. did you mean <button class="lnk" type="button">' + best + "</button>?", "err");
          q.querySelector("button").addEventListener("click", function () { run(best + (arg ? " " + arg : "")); });
        } else outp("command not found: " + esc(name) + ". try 'help'", "err");
      }
    }
    if (activeId === "shell" || !coarse) form.scrollIntoView({ block: "nearest" });
  }
  input.addEventListener("input", sync);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault(); var v = input.value; input.value = ""; sync(); run(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); if (hIdx > 0) { hIdx--; input.value = history[hIdx]; sync(); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; } else { hIdx = history.length; input.value = ""; }
      sync();
    } else if ((e.key === "Tab" || e.key === "ArrowRight") && ghost.textContent) {
      e.preventDefault(); acceptGhost();
    } else if (e.key === "Tab") {
      e.preventDefault();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault(); log.innerHTML = "";
    }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  ghost.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); acceptGhost(); input.focus(); });
  form.addEventListener("click", function () { input.focus({ preventScroll: true }); });
  log.addEventListener("click", function (e) { if (!e.target.closest("a,button")) input.focus({ preventScroll: true }); });
  // desktop: start typing anywhere and it goes to the shell
  window.addEventListener("keydown", function (e) {
    if (coarse || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    var t = e.target;
    if (t === input || (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA"))) return;
    if (e.key === " " ) return;
    reveal($("shell"));
    input.focus({ preventScroll: true });
    $("shell").scrollIntoView({ block: "end" });
  });

  /* ================= start ================= */
  var stages = {}, stageList = [];
  function start() {
    Array.prototype.slice.call(document.querySelectorAll(".stage[data-stage]")).forEach(function (el) {
      var st = Stage(el, el.getAttribute("data-stage"));
      stages[el.getAttribute("data-stage")] = st; stageList.push(st);
    });
    // only animate the stages that are on screen
    if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { stageList.forEach(function (st) { if (st.host === e.target) st.visible = e.isIntersecting; }); });
      }, { rootMargin: "80px 0px" });
      stageList.forEach(function (st) { vio.observe(st.host); });
    }
    var last = performance.now();
    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      stageList.forEach(function (st) { if (st.visible) st.frame(dt); });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(function (n) { last = n; loop(n); });
  }
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load(FS + "px DVSM"), document.fonts.load("bold " + FS + "px DVSM")]).then(start, start);
  } else start();
})();

;(function () {
  var Y = 365.2425 * 864e5;
  var me = Date.parse("2011-06-05T00:00:00+09:00"), tora = Date.parse("2023-09-16T00:00:00+09:00");
  var a = document.getElementById("myAge"), t = document.getElementById("toraAge");
  function tick() {
    var n = Date.now();
    if (a) a.textContent = ((n - me) / Y).toFixed(9);
    if (t) t.textContent = ((n - tora) / Y).toFixed(9);
    requestAnimationFrame(tick);
  }
  tick();
})();
