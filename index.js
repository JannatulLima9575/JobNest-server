const express = require('express')
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());


// get from mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zmzpu5s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    // connect to the database and collection [3.Hot Jobs]
    const jobsCollection = client.db('careerCode').collection('jobs');

    // collection of job application
    const applicationsCollection = client.db('careerCode').collection('applications')

    // get all jobs [3.Hot Jobs] jobs api
    app.get('/jobs', async (req, res) => {
      // for get my all posted data
      const email = req.query.email;
      const query = {};
      if(email){
        query.hr_email = email;
      }

      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // could be done BUT should not be done
    // app.get('/jobsByEmailAddress', async(req, res) => {
    //   const email = req.query.email;
    //   const query = {hr_email: email}
    //   const result = await jobsCollection.find(query).toArray();
    //   res.send(result);
    // });

      app.get('/jobs/applications', async(req, res) => {
      const email = req.query.email;
      const query = {hr_email: email};
      const jobs = await jobsCollection.find(query).toArray();
      
      // should use aggregate to have optimum data fetching 
      for(const job of jobs) {
        const applicationQuery = {jobId: job._id.toString()}
        const application_count = await applicationsCollection.countDocuments(applicationQuery)
        job.application_count = application_count;
      }
      res.send(jobs);
    })

    // get a single job
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(query);
      res.send(result)
    });

    // post job
    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      console.log(newJob);
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });



    //job applications related apis
    app.get('/applications', async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant: email
      }
      const result = await applicationsCollection.find(query).toArray();
      
      // bad way to aggregate data
      for (const application of result) {
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) }
        const job = await jobsCollection.findOne(jobQuery);
        application.company = job.company
        application.title = job.title
        application.company_logo = job.company_logo
        application.category = job.category
      }
      res.send(result);
    })

    // get specifics any applications id
    app.get('/applications/job/:job_id', async (req, res) => {
      const job_id = req.params.job_id;
      const query = {jobId: job_id}
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/applications', async (req, res) => {
      const application = req.body;
      const result = await applicationsCollection.insertOne(application);
      res.send(result);
    })

    // for appellant data
    app.patch('/applications/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          status: req.body.status
        }
      }
      const result = await applicationsCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })


    // Send a ping to confirm a successful connection

    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// routes


app.get('/', (req, res) => {
  res.send('Career Code Cooking!')
})

app.listen(port, () => {
  console.log(`Career Code is running on port ${port}`)
})
