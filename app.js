const express = require("express")
const bodyParser = require("body-parser")
const date = require(__dirname+"/date.js")
const _ = require("lodash")
const mongoose = require("mongoose")
const { name } = require("ejs")
const port = 3000

const app = express()
app.use(bodyParser.urlencoded({extended:true}))
app.set("view engine", "ejs")
app.use(express.static("public"))
mongoose.connect("mongodb://127.0.0.1:27017/ToDoList-v2")

const listSchema = new mongoose.Schema({
    name: String
})
const List = mongoose.model("List", listSchema)
const item1 = new List({
    name:"Buy Food"
})
const item2 = new List({
    name:"Cook Food"
})
const item3 = new List({
    name:"Eat Food"
})
const defaultItem = [item1,item2,item3]

const customListSchema = {
    name: String,
    items: [listSchema]
}
const CustomList = new mongoose.model("CustomList", customListSchema)

var day = date.getDate()
app.get("/", (req,res)=>{
    List.find()
    .then((foundItems)=>{
        if(foundItems.length === 0){
            List.insertMany(defaultItem)
                .then(()=>{
                    console.log("Pre-item inserted!")
                })
                .catch((err)=>{
                    console.log(err)
                })
            res.redirect("/")
        } else{
            res.render("list", {listTitle: day, newListItem: foundItems})
        }
    })
    .catch((err)=>{
        console.log(err)
    })
})

app.get("/:customList", (req,res)=>{
    const customListName = _.capitalize(req.params.customList)
    CustomList.findOne({ name: customListName })
    .then((foundItem) => {
        if (!foundItem) {
            const list = new CustomList({
                name: customListName,
                items: defaultItem
            })
            list.save()
            res.redirect("/"+customListName)
        } else {
            res.render("list", {listTitle: foundItem.name, newListItem: foundItem.items})
        }
    })
    .catch((err) => {
        console.error(err);
    })
})


app.post("/", (req,res)=>{
    const newItemName = req.body.newItem
    const listName = req.body.button
    const item = new List({
        name: newItemName
    })
    if(listName === day){
        item.save()
        res.redirect("/")
    } else {
        CustomList.findOne({name:listName})
            .then((foundList)=>{
                foundList.items.push(item)
                foundList.save()
                res.redirect("/"+listName)
            })
    }
})

app.post("/delete", (req,res)=>{
    const itemId = req.body.checkbox
    const listName = req.body.listName

    if(listName === day){
        List.deleteOne({_id: itemId}) 
        .then(()=>{
            console.log("Item deleted!")
        })
        .catch((err)=>{
            console.log(err)
        })
    res.redirect("/")
    } else{
        CustomList.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}) 
        .then(()=>{
            console.log("Item deleted!")
        })
        .catch((err)=>{
            console.log(err)
        })
    res.redirect("/"+listName)
    }
})

app.listen(port, ()=>{
    console.log("App running on port "+port)
})
