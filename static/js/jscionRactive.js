// Depends on underscore.js.
//
function jsionRactive(ctx) {
  var classes = ctx.filterObjs(function(o) { return o.class == "class"; }).result;
  var renderers = {};
  return { partials: _.object(_.map(classes, makeRenderer)),
           renderers: renderers };

  function makeRenderer(cls) {
    var props = ctx.flattenProperties(cls).result;
    var keys = _.sortBy(_.keys(props), function(k) { return props[k].displayOrder; });
    var s = _.map(keys, function(k) {
        var p = props[k];

        var fname = cls.name + "_" + k;
        renderers[fname] = function(obj, opts) {
          opts = opts || {};
          var v = obj[k];
          var vx = (k == "class" && !v) ? cls.name : v;
          var t = ctx.getTypeByName(p.propertyKind || "any").result || {};
          var n = (opts.mode || "view") + "Template";
          var tm = p[n] || ((ctx.flattenType(t).result || {})[n]);
          return _.template(tm, { ctx: ctx, property: p, type: t, k: k, o: obj, v: vx });
        }

        var v = "{{{renderers." + fname + "(.,opts)}}}";
        var c = ctx.getClassByName(p.propertyKind).result;
        if (c) {
          v = makeRenderer(c)[1];
        }
        if (p.class == "propertyArray") {
          v = '<ul class="propertyArray">\n' +
              "{{#." + k + "}}\n<li>" + v + "</li>\n{{/." + k + "}}\n</ul>";
        }
        return ('<li class="' + p.propertyKind + " " + k + '">' +
                "<label>" + k + "</label><span>" + v + "</span></li>");
      }).join("\n");
    return [cls.name,
            '<ul class="' + ctx.classImplements(cls.name).join(" ") + '">' + s + "</ul>"];
  }
}
