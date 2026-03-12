
(function () {
  var img = new Image();
  img.onload = img.onerror = function () {
    document.documentElement.classList.add(img.height === 2 ? 'webp' : 'no-webp');
  };
  img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4TCEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
})();
