const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
var item = [];
//const ejsLint = require('ejs-lint');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}))
// app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

main().catch(err => console.log(err));

async function main(){
  await mongoose.connect('mongodb://127.0.0.1:27017/todolist');
}

const ToDoListSchema = new mongoose.Schema({
  name : {
    type : String,
    required : true
  }
});

const listSchema = new mongoose.Schema({
  name : String,
  items : [ToDoListSchema]
});

const ToDoList = mongoose.model('TodoList', ToDoListSchema);
const List = mongoose.model("list", listSchema);

const wakeup = new ToDoList({
  name : "Welcome To Do List"
})

const brush = new ToDoList({
  name : "Press + to add items"
})

const breakfast = new ToDoList({
  name : "<-- Press this to delete the items"
})
var itemList = [];


itemList = [wakeup, brush, breakfast];


app.get("/", (req, res) => {
  var date = new Date();
  var options = {
    weekday : 'long',
    year : 'numeric',
    month : 'long',
    day : 'numeric'
  };


  var day = date.toLocaleDateString('en-Us',options);
  ToDoList.find({}, function(err, items){
    if(items.length === 0){

      ToDoList.insertMany(itemList, function(err){
        if(err){
          console.log("Error Adding Item To The List");
        }
        else{
          console.log("Items Added SucessFully")
        }
      })
      res.redirect("/");
    }
    else{
      res.render("list", {todaysDay : "Today", filler : items});
    }
    if(err){
      console.log("Error has ocuured");
    }
    else{
        console.log("Items Added SucessFully");
      }
  });

})

app.get("/:cutomeListName", (req, res) => {
  const customListName = _.capitalize(req.params.cutomeListName);
  List.findOne({name : customListName}, (err, data) => {
    if(data){
      res.render("list", {todaysDay : data.name, filler : data.items})
    }
    else{
      const list = new List({
        name : customListName,
        items : itemList
      })

      list.save();
      res.redirect("/"+customListName)
    }
  })

})

app.post("/toDoForm", (req, res) => {
  //console.log(req);
  let itemName = req.body.itemName;
  let listName = req.body.submitButton;

  let newIte = new ToDoList({
    name : itemName
  })

  if(listName == "Today"){
    newIte.save();
    res.redirect("/");
  }
  else{
    List.findOne({name : listName}, function(err, foundList){
      console.log(listName);
      foundList.items.push(newIte);
      foundList.save();
      res.redirect("/" + listName);
    })
  }


})


app.post("/delete", (req, res) => {
  let checkboxVal = req.body.checkbox;
  var listName = req.body.listName;

  if(listName === "Today"){
    ToDoList.findByIdAndRemove(checkboxVal, (err) => {
      if(err){
        console.log(err);
      }
    });
    console.log(checkboxVal);
    res.redirect("/");
  }
  else{
    List.findOneAndDelete({name : listName}, {$pull : {items : { _id :checkboxVal}}}, function(err, foundItmes){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

})

app.listen(3000, () =>  {
  console.log("Listening to port 3000");
})
