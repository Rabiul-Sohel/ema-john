const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  
}));
app.use(express.json());
app.use(cookieParser())

// const logger = async(req, res, next)=>{
//   console.log('logged in from logger');
//   next()
// }
const verifyToken = (req, res, next)=>{
  const token = req.cookies.token;
  console.log(token);
  if(!token){
   return res.status(401).send({message: 'Not Authorized'})
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'Not Authorized'})
    }
    req.user = decoded;
    // console.log(token);
    next()
  })
  // console.log(req.cookies.token, 'token from verify token');

}     

  
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ndy3clf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();

    const productCollection = client.db('emaJohnDB').collection('products');
    const orderCollection = client.db('emaJohnDB').collection('orders');
    app.post('/jwt', async(req, res)=>{
      const user = req.body
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {expiresIn: '1h'})
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: false,
        secure: false  
      })
      .send({
        success: true
      })

    })   

    app.get('/products', async(req, res) => {
        const user = req.user;
        // console.log(user);
        const result = await productCollection.find().toArray();
        res.send(result);
    })
    app.post('/orders', async(req, res)=>{
      const order = req.body;
      const result = await orderCollection.insertOne(order)
      res.send(result)
      // console.log(order);
    })
    app.get('/orders', verifyToken, async(req, res)=>{
      const user = req.user
      const customerEmail = req.query.email;
      if(user.email !== customerEmail){
        return res.status(402).send({message: 'Access Forbidden'})
      }
      const query = {customer_email: customerEmail}
      const cursor = orderCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
      // console.log(user);
    })

    app.get('/productsPage', async(req, res)=>{
      // const token = req.cookies.token;
      // console.log(token, 'from product page');
      const currentPage = parseInt(req.query.page);
      const limit = parseInt(req.query.limit)
      const totalProducts = await productCollection.countDocuments();
      const result = await productCollection.find()
        .skip((currentPage - 1) * limit)
        .limit(limit)
        .toArray()
      // console.log(currentPage, limit, totalProducts, result);
      res.send({
        totalPages: Math.ceil(totalProducts/ limit),
        data: result,
      })
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


app.get('/', (req, res) =>{
    res.send('john is busy shopping')
})

app.listen(port, () =>{
    console.log(`ema john server is running on port: ${port}`);
})
