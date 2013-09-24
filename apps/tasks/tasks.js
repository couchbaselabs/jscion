function main(ctx, session) {
  session.statusChoices = session.statusChoices ||
    _.clone(_.findWhere(ctx.getClassByName("task").result.properties, { "name": "status" }).valueChoices);

  var tasks = session.tasks = session.tasks || [];
  var render = session.render("tasks");

  render.on({
      "newTask": function(event) {
        var task = ctx.newObj("task").result;
        task.title = (event.node.value || "").trim();
        task.createdAt = task.updatedAt = new Date().toJSON();
        render.get("tasks").unshift(task);
        renderTask(render, task);
        event.node.value = "";
        event.node.focus();
      },
      "showTask": function(event) {
        renderTask(render, findTask(tasks, event.node.id));
      },
      "saveTask": function() {
        var edit = render.get("objEdit");
        var orig = findTask(render.get("tasks"), edit.createdAt);
        _.extend(orig, edit);
        _.each(_.keys(orig), function(k) {
            if (_.isString(orig[k])) { orig[k] = orig[k].trim(); }
          });
        renderTask(render, orig);
        render.update("tasks");
      },
      "editTask": function() {
        renderTask(render, render.get("obj"), { "doEdit": !render.get("doEdit") });
        if (render.get("doEdit")) {
          setTimeout(function() { $("#objEdit_title").focus(); });
        }
      },
      "addComment": function() {
        renderTask(render, render.get("obj"), { "doComment": !render.get("doComment") });
        if (render.get("doComment")) {
          setTimeout(function() { $("#commentMessage").focus(); });
        }
      },
      "saveComment": function() {
        var task = render.get("obj");
        if (task) {
          var m = (render.get("commentMessage") + "").trim();
          if (m) {
            var c = ctx.newObj("taskMessage").result;
            c.createdAt = c.updatedAt = new Date().toJSON();
            c.message = m;
            task.messages = task.messages || [];
            task.messages.push(c);
          }
        }
        renderTask(render, task);
      }
    });
}

function findTask(tasks, createdAt) {
  return _.find(tasks, function(task) { return task.createdAt == createdAt; });
}

function renderTask(render, task, extras) {
  render.set(_.defaults(extras || {}, { "obj": task,
                                        "objEdit": _.clone(task),
                                        "doEdit": false,
                                        "doComment": false,
                                        "commentMessage": "" }));
}
