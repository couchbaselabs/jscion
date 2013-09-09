function makeCtx(data) {
  function get(ident) { return { err: null, result: data[ident] }; }
  function getClass(dobj) { return get("class-" + dobj["class"]); }
  return { "get": get,
           "getClass": getClass };
}

function render(ctx, ident) {
  var o = ctx.get(ident);
  if (o.err || !o.result) {
    return { err: o.err || ("no object with ident: " + ident) };
  }
  var c = ctx.getClass(o.result);
  if (c.err || !c.result) {
    return { err: c.err || ("no class for obj with ident: " + ident) };
  }
  return { result: JSON.stringify(c.result) + " " + JSON.stringify(o.result) };
}
