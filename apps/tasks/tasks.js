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
        renderTask(render, orig);
        render.update("tasks");
      },
      "editTask": function() { render.set("edit", !render.get("edit")); },
      "wantComment": function() { render.set("comment", !render.get("comment")); }
    });
}

function findTask(tasks, createdAt) {
  return _.find(tasks, function(task) { return task.createdAt == createdAt; });
}

function renderTask(render, task) {
  render.set({ "obj": task,
               "edit_obj": _.clone(task),
               "edit": false,
               "comment": false });
}
