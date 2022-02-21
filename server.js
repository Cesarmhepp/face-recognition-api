const express = require('express');
const app = express();
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'efizity.2021',
        database: 'face-recognition'

    }
})

db.select('*').from('users')
    .then(data => {
        console.log(data);
    })

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());



app.get('/', (req, res) => {
    res.send('success')
})

app.post('/signin', (req, res) => {
    const bcrypt = require('bcrypt');
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            console.log(isValid);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', req.body.email)
                    .then(user => {
                        console.log(user)
                        res.json(user[0]);
                    })
                    .catch(err=>res.status(400).json('unable to get user'))
               
            }else{
                res.status(400).json('wrong credentials')
            }
            
        })
        .catch(err=>res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
    const bcrypt = require('bcrypt');
    const { email, name, password } = req.body;
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, function (err, hash) {
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
                .into('login')
                .returning('email')
                .then(loginEmail => {
                    return trx('users')
                        .returning('*')
                        .insert({
                            email: email,
                            name: name,
                            joined: new Date()
                        })
                        .then(user => {
                            res.json(user[0]);
                        })
                })
                .then(trx.commit)
                .catch(trx.rollback)
        })
            .catch((err) =>{ 
                res.status(400).json('unable to register')
                console.log(err);
            })

    })

})


app.get('/profile/:id', (req, res) => {
    const { id } = req.params;

    db.select('*').from('users').where({ id: id })
        .then(user => {
            if (user.length) {
                res.json(user[0])
            } else {
                res.status(404).json('not found')
            }

        })
        .catch(err => res.status(400).json('error getting user'))

})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0].entries);
        })
        .catch(err => { res.status(400).json('unable to get entries') })
})

app.listen(3000, () => {
    console.log('app is running on port 3000')

})





