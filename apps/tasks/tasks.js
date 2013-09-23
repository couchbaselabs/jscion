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
        renderTask(render,
                   _.find(tasks,
                          function(task) { return task.createdAt == event.node.id; }));
      },
      "toggleEdit": function() { render.set("edit", !render.get("edit")); },
      "toggleComment": function() { render.set("comment", !render.get("comment")); }
    });
}

function renderTask(render, task) {
  render.set({ "obj": task,
               "edit_obj": _.clone(task),
               "edit": false,
               "comment": false });
}
