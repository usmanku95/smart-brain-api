const express= require('express');
const bodyParser=require('body-parser');
const bcrypt=require('bcrypt-nodejs');
const cors=require('cors');

const knex = require('knex');

const db= knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'admin',
    database : 'smart-brain'
  }
});

console.log(db.select('*').from ('users'));

const app= express();

app.use(bodyParser.json());
app.use(cors());

const database= {
	users: [
	{
		id: '123',
		name: 'john',
		password: 'cookies',
		email: 'john@gmail.com',
		entries: 0,
		joined: new Date(),

	},
	{
		id: '124',
		name: 'sally',
		password: 'bananas',
		email: 'sally@gmail.com',
		entries: 0,
		joined: new Date(),

	}

	],
	login:[
	{
		id: '987',
		hash: '',
		email:''
	}]
}

app.get('/', (req, res)=>{
	res.json(database.users);
})

app.get('/profile/:id', (req, res)=>{
	const { id }=req.params;
	db.select('*').from('users').where({id})
	.then(user=>{
		if (user.length)
		{
			res.json(user[0])
		}
		else
		{
			res.status(400).json('Not found');
		}
	})
	.catch(err => res.status(400).json('error getting user'))
	
})

app.post('/signin', (req, res)=>{
	db.select('email', 'hash').from('login')
		.where('email', '=' ,req.body.email)
		.then(data=>{
		const isValid= bcrypt.compareSync(req.body.password, data[0].hash);
		if (isValid)
		 {
		 	return db.select('*').from('users')
		 	.where('email','=',req.body.email)
		 	.then(user=>{
		 		res.json(user[0])
		 	})
		 	.catch(err=> res.status(400).json('unable to get the user'))
		 } else
		 {
		 	res.status(400).json('wrong credentials too!')
		 }

	})
		.catch(err=> res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res)=>{
	const {email,name,password}=req.body;

	const hash = bcrypt.hashSync(password);

	db.transaction(trx=>{
		trx.insert({
			hash:hash,
			email:email
		})
		.into('login')
		.returning('email')
		.then(loginEmail=>{
		 return	trx('users')
			.returning('*')
			.insert({
				email: loginEmail[0],
				name: name,
				joined: new Date()

			}).then(user=>{
				res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})


// bcrypt.compareSync("veggies", hash); // false

	
	.catch(err=> res.status(400).json('unable to register'))
	
})

app.put('/image', (req, res)=>{
	const { id }=req.body;
	db('users').where('id', '=', id)
    .increment('entries',1)
    .returning('entries')
    .then(entries=>{
    	res.json(entries[0]);
    })
    .catch(err=> res.status(400).json('unable to get entries'))
  })





// Load hash from your password DB.



app.listen(3001, ()=>{
	console.log("app isss srnning on port 3001");
})
