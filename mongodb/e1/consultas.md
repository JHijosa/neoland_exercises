```
db.restaurants.count({"type_of_food": "American"})
db.restaurants.find({"type_of_food": "Pizza"}).limit(5).sort({rating: -1})
db.restaurants.find({name: "241 Pizza"},{_id: 0, address: 1})
db.restaurants.find({$and: [{"type_of_food": {$in:["Chinese", "Curry", "Thai"]}},{"rating": {$gte: 4.5}}]}).sort({rating: -1})
db.restaurants.find({$and: [{"type_of_food": {$in: ["Pizza", "American"]}},{"postcode": "3HR"}]}).sort({rating: -1})
db.restaurants.find().skip(50).limit(10)
```
