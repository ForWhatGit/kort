require('mongoose').model('CardSortStudy');
var mongoose = require('mongoose');

var CardSortStudy = mongoose.model('CardSortStudy');


module.exports = {
    create_ajax: function (req, res) {
        var newStudy = new CardSortStudy({
            title: "New Cardsort",
            type: "cardsort",
            studyType: "open",
            cards: ['card1','card2','card3'],
            groups: ['group1','group2','group3'],
            responses: [],
            active: false,
            ownerID: req.user._id
        });
        newStudy.save(function (err) {
            if (err) {
                console.log('cardsort_server.js: Error creating new cardsort via POST.');
                res.status(504);
                res.end(err);
            } else {
                console.log('cardsort_server.js: Created new cardsort via POST successfully.');
                res.send(newStudy);
                res.end();
            }
        });
    },
    view: function (req, res, next) {
        CardSortStudy.findOne({_id: req.params.id}, function (err, docs) {
            if (err) {
                res.status(504);
                console.log("cardsort_server.js: Error viewing cardsort.");
                res.end(err);
            } else {
                res.render('cardsort/view.ejs',{singleStudy: docs});
            }
        });
    },
    edit: function (req, res, next) {
        CardSortStudy.findOne({_id: req.params.id}, function (err, docs) {
            if (err) {
                res.status(504);
                console.log("cardsort_server.js: Error edit cardsort.");
                res.end(err);
            } else {
                res.render('cardsort/edit.ejs',{singleStudy: docs});
            }
        });
    },
    results: function (req, res, next) {
        CardSortStudy.findOne({_id: req.params.id}, function (err, study) {
            if (err) {
                res.status(504);
                console.log("cardsort_server.js: Error getting study to see results.");
                res.end(err);
            } else {
				//results matrix for heatmap
				var matrix = new Array(study.groups.length);
				for (var i = 0; i < study.groups.length; i++) {
					matrix[i] = new Array(study.cards.length);
					matrix[i].fill(0);
				}

				study.responses.forEach(function(response){
					response.shift(); //remove date (first item)
					response.forEach(function(pair){
						var groupIndex = study.groups.indexOf(pair.groupname);
						var cardIndex = study.cards.indexOf(pair.cardname);
						matrix[groupIndex][cardIndex]+=1;
					})
				})
				res.render('cardsort/results.ejs',{study: study, matrix: matrix});
            }
        });
    },
    update: function (req, res, next) {
        var cards = req.body.cards.split(/\r?\n/).map(function(item) {
             return item.trim();
        }).filter(function(n){ return n != '' });
        var groups = req.body.groups.split(/\r?\n/).map(function(item) {
             return item.trim();
        }).filter(function(n){ return n != '' });
        CardSortStudy.findByIdAndUpdate(
            { _id: req.body.id}, 
            {title: req.body.title,
             studyType: req.body.studyType,
             cards: cards,
             groups: groups,
             active: active
            }, 
            function (err, docs) {
            if (err) {
                res.status(504);
                console.log('cardsort_server.js: error updating cardsort');
                res.end(err);
            } 
            else {
                res.redirect('/studies');
                res.end();   
            }
        });
    },
    submitResult: function (req, res, next) {
        CardSortStudy.findOne({ _id: req.body.id}, 
            function (err, study) {
                if (err) {
                    res.status(504);
                    console.log('cardsort_server.js: error submitting result');
                    res.end(err);
                } 
                else {
                    study.responses.push(JSON.parse(req.body.result));
                    console.log(study.responses.length);
                    study.save();
                    res.redirect('/studies');
                    res.end();   
                }
        });
    },
    delete: function(req, res, next) {
        CardSortStudy.find({ _id: req.params.id}, function(err) {
            if (err) {
                req.status(504);
        		console.log("cardsort_server.js: Cannot find study to delete:" + req.params.id);
        		console.log(err);
                req.end();
            }
        }).remove(function (err) {
            if (err) {
                console.log(err);
                res.end(err);            
            } else {
                res.redirect('/studies');
                res.end();
            }
        });
    },
}
