var http=require("http");
var express = require('express');
var socketio=require('socket.io');


var app=express();//1


var session=require('express-session');//1
const path = require('path')
const PORT = process.env.PORT 
const { Pool } = require('pg');
var bodyParser = require('body-parser');
var Pokedex=require('pokedex-promise-v2');
var P = new Pokedex();



var server=http.createServer(app); 
var io= socketio.listen(server);

server.listen(PORT, () => console.log(`Listening on ${ PORT }`));
//app.listen(PORT, () => console.log(`Listening on ${ PORT }`))



//var gameserver=http.createServer(app); 
//var gameio= socketio.listen(gameserver);

//gameserver.listen(PORT, () => console.log(`Listening on ${ PORT }`));


// 客户端计数
var clientCount = 0;

// 用来存储客户端socket
var socketMap = {};

var bindListener = function(socket, event){
    socket.on(event, function(data){
        if(socket.clientNum % 2 == 0){
            if(socketMap[socket.clientNum - 1]){
                socketMap[socket.clientNum - 1].emit(event,data);
            }
        } else {
            if(socketMap[socket.clientNum + 1]){
                socketMap[socket.clientNum + 1].emit(event,data);
            }
        }
    })
}


io.on('connection', function(socket){
  
  clientCount = clientCount + 1;
  socket.clientNum = clientCount;
  socketMap[clientCount] = socket;
  // 第一个用户进来让其等待配对
  if(clientCount % 2 == 1){
      socket.emit('waiting','waiting for another person');
  } else {    // 每对的第二个进来给他们发送开始消息
      // 如果不存在了说明掉线了
      if(socketMap[socket.clientNum - 1]){
          socket.emit('start');
          socketMap[(clientCount - 1)].emit('start');
      } else {
          socket.emit('leave');
      }
  }

  // 把一方的初始值发送给另一方显示
  // socket.on('init', function(data){
  //     if(socket.clientNum % 2 == 0){
  //         socketMap[socket.clientNum - 1].emit('init',data);
  //     } else {
  //         socketMap[socket.clientNum + 1].emit('init',data);
  //     }
  // })
  // 简化
  bindListener(socket,'init');
  bindListener(socket,'next');
  bindListener(socket,'rotate');
  bindListener(socket,'right');
  bindListener(socket,'down');
  bindListener(socket,'left');
  bindListener(socket,'fall');
  bindListener(socket,'fixed');
  bindListener(socket,'line');
  bindListener(socket,'time');
  bindListener(socket,'lose');
  bindListener(socket,'bottomLines');
  bindListener(socket,'addTailLines');
  
  
  
  socket.on('disconnect', function(){
      if(socket.clientNum % 2 == 0){
          if(socketMap[socket.clientNum - 1]){
              socketMap[socket.clientNum - 1].emit('leave');
          }
      } else {
          if(socketMap[socket.clientNum + 1]){
              socketMap[socket.clientNum + 1].emit('leave');
          }
      }
      delete(socketMap[socket.clientNum]);
  })
})



















// Chatroom
var numUsers = 0;

io.on('connection', (socket) => {
  var addedUser = false;
  console.log("new user connected");


  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });


  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });


  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });




});











//var pool = new Pool({
//  user: 'postgres',
//  password: 'postgres',
//  host: 'localhost',
//  database: 'test',
//  port: 5432,
//});


var pool = new Pool({
  connectionString : process.env.DATABASE_URL
})

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(express.static(path.join(__dirname, 'views')))
app.set('view engine', 'ejs')

//app.use(cookieParser());
app.use(session({
  secret:"secret key",
  resave:false,
  saveUninitialized: true,
  cookie: {user:"default",maxAge:60*15*1000}
}));







































app.post('/poke',function(req,res){
  // var name='nidoqueen';
  var hp,attk,def,sattk,sdef,spd,ht,wt;
  var name=req.body.name;
  console.log(name);

  P.getPokemonByName(name,function(result,error){
    if(!error){
      // stats
      hp=result.stats[5].base_stat;
      attk=result.stats[4].base_stat;
      def=result.stats[3].base_stat;
      sattk=result.stats[2].base_stat;
      sdef=result.stats[1].base_stat;
      spd=result.stats[0].base_stat;
      for ( i=5; i>=0 ;i--){
        console.log(result.stats[i].stat.name);
        console.log(result.stats[i].base_stat);
      }
        console.log("teststat hp");
        console.log(hp);
        console.log("teststat attk");
        console.log(attk);
        console.log("teststat def");
        console.log(def);
        console.log("teststat sattk");
        console.log(sattk);
        console.log("teststat sdef");
        console.log(sdef);
        console.log("teststat spd");
        console.log(spd);


      ht=result.height;
      console.log("height:"); 
      console.log(result.height);

      wt=result.weight;
      console.log("weight:"); 
      console.log(result.weight);
      console.log("type:");   
      var type="";
      for ( i=0; i< result.types.length;i++){
        type+=result.types[i].type.name+" ";
        // console.log("test");
        // console.log(type);
        // console.log("actual");
        // console.log(result.types[i].type.name);
 
      }
      res.json({status:0,hp:hp,attk:attk,def:def,sattk:sattk,sdef:sdef,spd:spd,ht:ht,wt:wt,type:type});
    } //if

    else {
      res.json({status:1,msg: "api error"});
      console.log("pokemon api error");
    }
  })//poke
//retur pokemon info

});

app.post('/poke1',function(req,res){
  var des;
  var name=req.body.name;

  // description

  P.getPokemonSpeciesByName(name)

    .then(function(result){
      var found=0;
      var i=0;
      while(found==0){
        if(result.flavor_text_entries[i].language.name=="en"){
          found=1;
        }
        else{
          i++;
        }
      }
      des=result.flavor_text_entries[i].flavor_text;
      console.log(result.flavor_text_entries[i].flavor_text);
      res.json({status:0,des:des});
    })

    .catch(function(error){
      console.log("description err");
      res.json({status:1,msg: "description error"});
    })

});//poke1


app.post("/login", function(req, res){
  var user=req.body.Lid;
  var pwd=req.body.Lpassword;
  //console.log("result id is " + user);
  //gm
  var match = "select * from gm where id in " + "('" + user + "')" + ";"; 
  //console.log(match);

  pool.query(match, function(error, result){
    //console.log(result.rows);
  

    if(result.rows.length == 0){
      //players
      var match = "select * from players where id in " + "('" + user + "')" + ";"; 
      //console.log(match);

      pool.query(match, function(error, result){

        //console.log(result.rows);
    
	      if(result.rows.length == 0) {
          //console.log("UseID does not exist!");
          res.json({status:1,msg: "userID does not exist"});
          //res.redirect('https://stark-spire-21434.herokuapp.com/wrongID.html');
	      }
	      else if(result.rows[0].password != pwd){
          //console.log("Wrong password!");
          res.json({status:1,msg: "user wrong pass"});
          //res.redirect('https://stark-spire-21434.herokuapp.com/wrongPassword.html');
        } 	  
        // matching user found in db, add session
        else{
          //console.log("Login succeeded!");
          req.session.user = user;
          req.session.isLogin = true;
              res.json({status:0,msg: "user login success~"});
          //location.href='https://stark-spire-21434.herokuapp.com/homepage.html';
        } 
      }); 
    }


    else if(result.rows[0].password != pwd){
      console.log("Wrong password!");
      res.json({status:1,msg: "gm wrong pass"});

      //res.redirect('https://stark-spire-21434.herokuapp.com/wrongPassword.html');
    }
    else if(result.rows[0].password == pwd){
      console.log("Login succeeded!");
      req.session.user = user;
      req.session.isLogin = true;
      res.json({status:-1,msg: "GM login success~"});

      //res.redirect('https://stark-spire-21434.herokuapp.com/GM.html');
    }
  })//outer query
}); //login

//for gm
app.get('/userlist',function(req,res){
  console.log("server receive userlist req");
  console.log(req.session.isLogin);
  var message="select msg from gm_msg where id=1;";
  console.log(message);
  pool.query(message,function(error,result){
    console.log(result.rows[0].msg);
    res.json({status:-1,user:req.session.user,msg:result.rows[0].msg});
  })
});

app.get('/logout',function(req,res){
  console.log("server receive logout req");
  console.log("destroying session");
  req.session.isLogin= false;
  req.session.destroy();
  res.json({status:-1,msg:"session ended"});
});




app.post('/signup', function(req, res){
	var sid=req.body.sid;
	var spass=req.body.spassword;
	var sname=req.body.sname;
	var sage=req.body.sage;
	var sques=req.body.squestion;
	var sans=req.body.sanswer;
	var insert = "insert into players values ("   + "'" +  sid      + "'" + "," 
                                                + "'" +  spass    + "'" + "," 
                                                + "'" +  sname    + "'" + "," 
                                                +        sage           + "," 
                                                +        sques          + "," 
                                                + "'" +  sans     + "'"     
                                                + ")"     
                                                + ";"  ;
  
  var match = "select * from gm where id in " + "('" + sid + "')" + ";"; 
  console.log(match);
                                              
  pool.query(match, function(error, result){
    console.log(result.rows);
    if(result.rows.length != 0){
      //console.log("Sorry!You can not sign up as GM!");
      res.json({status:-1,msg:"Sorry! Connot us GM id!"})
      //res.redirect('https://stark-spire-21434.herokuapp.com/alert.html');
    }

    else{
	    console.log(insert);
 
      pool.query(insert, function(error, result){
        //console.log(error);
    
        if(error) {
          console.log("Insert failed!");
          res.json({status:-1,msg:"Sign Up failed, please try again!"});
          //res.redirect('https://stark-spire-21434.herokuapp.com/signupFailed.html');
        }
        else{
            console.log("Insert succeeded!");
            var results = result.rows;
            console.log(results);
            res.json({status:0,msg:"Successed!"});
            //res.redirect('https://stark-spire-21434.herokuapp.com/login.html');
        }
      });    
    } //else

  }) //outer query
});//signup



app.post('/gmmessage', function(req, res){
  var mes=req.body.gmessage;
  var insert = "update gm_msg set msg='"+mes+"' where id=1;" 
  console.log(insert);
  pool.query(insert, function(error, result){
    if(error) {
      console.log("Insert failed!");
    }
    else{
      console.log("Insert succeeded!");
      var results = result.rows;
      console.log(results);
    } 
  });
  res.redirect('https://stark-spire-21434.herokuapp.com/GM.html');
}); // end of gm msg


app.post('/remove', function(req, res){
  var dname=req.body.name;
  var remove = "delete from players where id =" +    "'" + dname + "'"  
                                                 + ";" ;   
  console.log(remove);

  pool.query(remove, function(error, result){
	  if(result.rowCount) {
      console.log("Remove succeeded!");
      res.json({status:0});
	  }
	  else{
      //return console.error(error);
      console.log("Remove failed!");
      res.json({status:-1});
	  } 	  
  })
});



app.post('/search', function(req, res){
	var search_cri=req.body.search_cri;
	var search = "select * from players where id like '%" + search_cri + "%';";                              
  //console.log(search);
  pool.query(search, function(error, result){
    if(error) {
        console.log("search db fail!");
        res.json({status:-1});
    }

    else{
  	  if(result.rowCount) {
         //console.log("Search succeeded!");
        console.log(result.rows[0]);

        var obj = [];
        var tmp;
        for (i=0;i<result.rowCount;i++){
            tmp= {  
            user: result.rows[i].id  ,    
            pass: result.rows[i].password , 
            name: result.rows[i].name };
          obj.push(tmp);
        }
        // var test= JSON.parse(json);
        var json = {
          status: 0,
          list: obj
        }
        //json=JSON.stringify(json);
        //var result;
        //result=JSON.parse(json)
        console.log("json");
        console.log(json);
        res.json(json);
  	   }
  	  else{
        console.log("Search failed!");
        res.json({status:-1,list:"Players not found"});
  	  } 	 
    }  
  }); 	  

  //res.redirect('https://stark-spire-21434.herokuapp.com/GM.html');
// res.redirect('http://localhost:5000/main.html');
});


app.post('/modify', function(req, res){
  //var mid=req.body.mid;

  var mid=   "'" + req.session.user + "'" ;

  var mpassword=req.body.mpassword;
  var mname=req.body.mname;
  var mage=req.body.mage;
  var mquestion=req.body.mquestion;
  var manswer=req.body.manswer;

  var fp="update players set ";
  var sp= " where id = " + mid + ";";
  var tmp;

  if(mpassword){
    tmp= fp + "password = " + "'" + mpassword + "'" + sp;
    pool.query(tmp, function(error, result){
	    if(error) {
	      console.log("mod fail!");
        res.json({status:-1});
	    }
    });
  }

  if(mname){
    tmp= fp + "name = " + "'" + mname + "'" + sp;
    pool.query(tmp, function(error, result){
	    if(error) {
	      console.log("mod fail!");
        res.json({status:-1});
	    }
    });
  }

  if(mage){
    tmp= fp + "age = " + mage + sp;
    pool.query(tmp, function(error, result){
	    if(error) {
	      console.log("mod fail!");
        res.json({status:-1});
	    }
    });
  }

// modify security question, get question from db?????
//security question 从heroku db 里的sec_q table 里取
//根据players 里sqnum，每个问题有个对应的数字
//Heroku pg:psql 登录

  if(mquestion){
    tmp= fp + "sqnum = " + mquestion + sp;
    pool.query(tmp, function(error, result){
	    if(error) {
	      console.log("mod fail!");
        res.json({status:-1});
	    }
    });
  }

  if(manswer){
    tmp= fp + "ans = " + "'"+ manswer + "'" + sp;
    pool.query(tmp, function(error, result){
	    if(error) {
	      console.log("mod fail!");
        res.json({status:-1});
	    }
    });
  }

  res.json({status:1});

  //res.redirect('https://stark-spire-21434.herokuapp.com/homepage.html');
});




// app.delete('/user/:id', (req, res) => {
//   console.log(req.params.id) 
//   // delete the user with id
// });
// app.set('views', path.join(__dirname, 'views'))
// app.set('view engine', 'ejs')
// app.get('/', (req, res) => res.render('pages/index'))



// app.get('/users/:id', function(req, res){
//   console.log(req.params.id);
// })





