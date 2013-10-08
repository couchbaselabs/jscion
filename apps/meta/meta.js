window.validators = window.validators || {};
window.validators.nonEmptyString = function(ctx, c, p, o, v) {
  if (!o[p.name]) {
    return p.name + " may not be empty";
  }
}
