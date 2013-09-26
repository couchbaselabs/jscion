function main(ctx, page) {
  page.statusChoices = page.statusChoices || findStatusChoices(ctx)
  page.tasks = page.tasks || [];
  page.obj = findTask(ctx, page.tasks, page.ident) || page.obj;

  if (!page.r || page.controller != page.prev.controller) {
    page.r = page.render("tasks");
    page.r.on({
      "newTask": function(event) {
        var task = ctx.newObj("task").result;
        task.title = (event.node.value || "").trim();
        if (task.title) {
          task.createdAt = task.updatedAt = new Date().toJSON();
          task.ident = "task-" + task.createdAt.replace(/[^0-9]/g, '') +
            Math.round(Math.random() * 10000);
          page.r.get("tasks").unshift(task);
          renderTask(page.r, task);
          event.node.value = "";
          event.node.focus();
        }
      },
      "saveTask": function() {
        var edit = page.r.get("objEdit");
        var orig = findTask(ctx, page.r.get("tasks"), edit.ident);
        var changes = [];
        _.each(_.keys(orig), function(k) {
            if (orig[k] != edit[k]) { changes.push(k); }
          });
        if (changes.length > 0) {
          edit.updatedAt = new Date().toJSON();
          _.extend(orig, edit);
          _.each(_.keys(orig), function(k) {
              if (_.isString(orig[k])) { orig[k] = orig[k].trim(); }
            });
          var c = ctx.newObj("taskMessage").result;
          c.createAt = c.updatedAt = new Date().toJSON();
          c.message = "(" + changes.join(",") + " edited)";
          orig.messages = orig.messages || [];
          orig.messages.push(c);
        }
        renderTask(page.r, orig);
        page.r.update("tasks");
      },
      "editTask": function() {
        renderTask(page.r, page.r.get("obj"), { "doEdit": !page.r.get("doEdit") });
        if (page.r.get("doEdit")) {
          setTimeout(function() { $("#objEdit_title").focus(); });
        }
      },
      "addComment": function() {
        renderTask(page.r, page.r.get("obj"), { "doComment": !page.r.get("doComment") });
        if (page.r.get("doComment")) {
          setTimeout(function() { $("#commentMessage").focus(); });
        }
      },
      "saveComment": function() {
        var task = page.r.get("obj");
        if (task) {
          var m = (page.r.get("commentMessage") + "").trim();
          if (m) {
            var c = ctx.newObj("taskMessage").result;
            c.createdAt = c.updatedAt = new Date().toJSON();
            c.message = m;
            task.messages = task.messages || [];
            task.messages.push(c);
          }
        }
        renderTask(page.r, task);
      }
    });
  }

  page.r.update("tasks");
  renderTask(page.r, page.obj);
}

function findTask(ctx, tasks, ident) {
  return ctx.findObj(where).result || _.find(tasks, where);
  function where(task) { return task.ident == ident; };
}

function renderTask(r, task, extras) {
  r.set(_.defaults(extras || {}, { "obj": task,
                                   "objEdit": _.clone(task),
                                   "doEdit": false,
                                   "doComment": false,
                                   "commentMessage": "" }));
}

function findStatusChoices(ctx) {
  return _.findWhere(ctx.getClassByName("task").result.properties, { "name": "status" }).valueChoices;
}
