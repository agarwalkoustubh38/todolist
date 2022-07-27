/*eslint-env es6*/

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//used to capitalize
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
//css files
app.use(express.static("public"));

mongoose.connect("mongodb+srv://koustubh38:kaF-104gf@cluster0.g51n7qn.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

const itemsSchema = {
  name: String
};

//two collections item and list
//item for main pages
//list for cutom name page and their entries
const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema] //for other pages localhost:300/Home   etc.
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) { //add default obly when nothing is there not everytime add
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else { // else for diff pages there are different list
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});

app.get("/:customListName", function(req, res) {
  //custom pages
  const customListName = _.capitalize(req.params.customListName);
  //find if the page exist with this name
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });



});
//taking request from form to add

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  // if home page
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    //custom page first find it in list
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
//from check box
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName; //from hidden input
  //if home page
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    //first findlist and then update
    List.findOneAndUpdate({
      name: listName
    }, {
      //smart way using mongoose to delete the item
      //first pull the items array then use id  to dlete record in  it
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        //redirect agin to this page
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});