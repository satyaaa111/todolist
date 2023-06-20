//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _= require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});


const itemsSchema = {
  name: String
};

const Item= mongoose.model(
  "Item", itemsSchema
);

const item1 = new Item({
  name: "Welcome to your todolist"
})

const item2 = new Item({
  name: "Hit the + button to add a new item"
})

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {


  Item.find()
  .then(items => {
    if(items.length === 0){

      Item.insertMany(defaultItems)
      .then(result => {

      console.log("succesfully inserted item to the database");
      mongoose.connection.close();

      })
      .catch(error => {
      console.log(error);
      });

      res.redirect("/");

    }
    else{
      
     res.render("list", {listTitle: "Today", newListItems: items});

    }

  })
  .catch(error => {
    console.log(error);
  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then(foundList => {
    if(!foundList){
      //Create a new List
      const list = new List({
        name : customListName,
        items : defaultItems
      });
    
      list.save();
      res.redirect("/"+customListName);
    }else{
      //show an existing list

      res.render("list",{listTitle: foundList.name, newListItems: foundList.items})
    }

  })
  .catch(error => {
    console.log(error);
  });


});




app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = Item({

    name: itemName
  });

  if(listName ==="Today"){
    item.save();
    res.redirect("/");

  }else{
    List.findOne({name: listName})
  .then(foundList => {
    foundList.items.push(item);
    foundList.save();
    res.redirect("/"+listName);
  })
  .catch(error => {
    console.log(error);
  });
  }



});

app.post("/delete", function(req, res){
  const checkItemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemID)
    .then(result => {
  
    console.log("succesfully deleted checked item");
    res.redirect("/");
  
    })
    .catch(error => {
    console.log(error);
    });  
    
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkItemID}}})
  .then(foundList => {
    res.redirect("/"+ listName);
  })
  .catch(error => {
    console.log(error);
  });
  }




})



// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
