const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env._PORT ;

// midlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@my-mongo-1.awz7p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeaders = req.headers.authorization;
    const token = authHeaders.split(' ')[1]
    jwt.verify(token, process.env.JWT, (error, decoded)=>{
        if(error){
           return res.status(403).res.send({message: 'forbidden access, your token is invalid'})
        }
        req.decoded = decoded;
    })

    

    next()
}

async function run(){
   try{
        await  client.connect();
        const servicesCollection = client.db('doc-online').collection('service');
        const ordersCollection = client.db('doc-online').collection('orders');

        app.get('/services', async (req, res)=>{
            const query = {};
            const services = await servicesCollection.find(query).toArray();
            console.log(services);
            res.send(services);
        });

        app.get('/services/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: parseInt(id)};
            const service = await servicesCollection.findOne(query);
            res.send(service);
        })

        app.post('/services', async(req, res)=>{
            const newService = req.body;
            const result = await servicesCollection.insertOne(newService);
            console.log(result);
            res.send(result);
        })

        // auth api
        app.post('/orders', async(req, res)=>{
            const order = req.body;
            const result = await client.db('doc-online').collection('orders').insertOne(order);
            res.send(result);
        })
        app.get('/orders', verifyJWT, async(req,res)=>{
            const decodedEmail = req.decoded.email;
            const email= req.query.email;
            if(decodedEmail === email){
                const query = {email : email};
                const orders = await ordersCollection.find(query).toArray();
                res.send(orders);
            }
            else{
                res.status(403).send({message: 'forbidden access'})
            }
            
        })
        app.post('/getJwt', async(req, res)=>{
            const user = req.body;
            const accessToken = jwt.sign(user,process.env.JWT, {
                expiresIn: '1d'
            });
            res.send({accessToken});

   })}
   finally{

   }
}

run().catch(console.dir);

app.get('/', (req, res)=>{
    res.send('hello doc online from server');
});

app.listen(port, ()=>{
    console.log('listening port: ', port);
});