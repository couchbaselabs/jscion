// Copyright (c) 2013 Couchbase, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//    http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.

// Generates Ractive partials and renderer functions.
function jsionRactive(ctx) {
  var res = { partials: {}, renderers: {} };
  _.each(ctx.filterObjs(function(o) { return o.class == "class"; }).result, visit);
  return res;

  function visit(cls) {
    var props = ctx.flattenProperties(cls).result;
    var keys = _.sortBy(_.keys(props), function(k) { return props[k].displayOrder; });
    var s = _.map(keys, function(k) {
        var p = props[k];

        var fname = cls.name + "_" + k;
        res.renderers[fname] = function(obj, opts) {
          var v = _.isObject(obj) ? ((k == "class" && !obj[k]) ? cls.name : obj[k]) : obj;
          var t = ctx.getTypeByName(p.propertyKind || "any").result || {};
          var n = ((opts || {}).mode || "view") + "Template";
          var m = p[n] || ((ctx.flattenType(t).result || {})[n]);
          return _.template(m, { ctx: ctx, property: p, type: t, k: k, o: obj, v: v });
        }

        var c = ctx.getClassByName(p.propertyKind).result;
        var v = c ? ("{{>__" + c.name + "}}") : ("{{{renderers." + fname + "(.,opts)}}}");
        if (p.class == "propertyArray" || p.class == "propertyDict") {
          v = '<ul class="' + p.class + '">\n{{#.' + k + ":_key}}\n" +
            "<li>" + (p.class == "propertyArray" ? "" : "{{_key}}: ") + v + "</li>\n" +
            "{{/." + k + "}}\n</ul>";
        }
        return ('<li class="' + p.propertyKind + " " + k + '">' +
                "<label>" + k + "</label><span>" + v + "</span></li>");
      }).join("\n");

    res.partials[cls.name] = // Partial for the class.
      '<ul class="' + ctx.classSupers(cls.name).join(" ") + ' opts_mode_{{opts.mode}}">'
      + s + "</ul>";
    res.partials["__" + cls.name] = // Partial for the class and its direct subclasses.
      _.map(ctx.classSubs(cls.name),
            function(cn) {
              return "{{# .class == '" + cn + "'}}\n{{>" + cn + "}}\n{{/}}";
            }).join("\n") + "\n{{# !.class}}\n{{>" + cls.name + "}}\n{{/}}";
  }
}
