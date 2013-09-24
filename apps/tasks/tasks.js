function main(ctx, session) {
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
        var edit = render.get("edit_obj");
        var orig = findTask(render.get("tasks"), edit.createdAt);
        _.extend(orig, edit);
        _.each(_.keys(orig), function(k) {
            if (_.isString(orig[k])) { orig[k] = orig[k].trim(); }
          });
        renderTask(render, orig);
        render.update("tasks");
      },
      "editTask": function() {
        renderTask(render, render.get("obj"), { "edit": !render.get("edit") });
        if (render.get("edit")) {
          setTimeout(function() { $("#edit_obj_title").focus(); });
        }
      },
      "addComment": function() {
        render.set("comment", !render.get("comment"));
        if (render.get("comment")) {
          setTimeout(function() { $("#commentMessage").focus(); });
        }
      },
      "saveComment": function() {
        var task = render.get("obj");
        if (task) {
          var m = render.get("commentMessage").trim();
          console.log(m);
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
                                        "edit_obj": _.clone(task),
                                        "edit": false,
                                        "comment": false,
                                        "commentMessage": "" }));
}
