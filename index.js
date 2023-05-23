const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 3000;
require('dotenv').config()

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@action.j82nnbv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)

        const myToysCollection = client.db("mytoys").collection("toylist");
        const categoryToysCollection = client.db("category").collection("categorytoys");

        app.get('/categoryToys', async (req, res) => {
            console.log(req.query.subCategory);
            let query = {};

            if (req.query.subCategory) {
                const validSubCategories = ['action', 'america', 'barbie'];
                if (validSubCategories.includes(req.query.subCategory)) {
                    query = { subCategory: req.query.subCategory };
                } else {
                    res.status(400).send('Invalid subcategory');
                    return;
                }
            }

            const result = await categoryToysCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/categoryToys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const result = await categoryToysCollection.findOne(query);
            res.send(result);
        });

        app.post('/mytoys', async (req, res) => {
            const toy = req.body;
            // console.log(toy);
            const result = await myToysCollection.insertOne(toy);
            res.send(result);
        })

        app.get('/mytoys', async (req, res) => {
            const search = req.query.search
            console.log(search)
            let query = {}
            if (req.query?.sellerEmail && req.query?.fetch == 'mytoys') {
                query = { sellerEmail: req.query.sellerEmail }
            }
            else if (req.query?.subCategory && req.query?.fetch == 'alltoys') {
                query = { subCategory: req.query.subCategory }
            }
            else if(req.query?.search && req.query?.fetch == 'alltoys') {
                query = { toyName: {$regex : search, $options : 'i'}}
            }

            const sortOrder = req.query?.sort === 'asc' ? 1 : -1;
            const result = await myToysCollection.find(query).sort({ price: sortOrder }).toArray();
            // console.log(result)
            res.send(result);
        })

        app.patch('/mytoys/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const updateToy = req.body;
            console.log(updateToy);
            const options = { upsert: true };
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    price: updateToy.price,
                    quantity: updateToy.quantity,
                    details: updateToy.details
                },
            };
            const result = await myToysCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        app.get('/mytoys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await myToysCollection.findOne(query);
            res.send(result);
        })


        app.delete('/mytoys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await myToysCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Welcome to the toy server')
})

app.listen(port, () => {
    console.log(`listening on port ${port}`);
})