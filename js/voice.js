/* Recorded narration. Clips live in assets/voice/line-NN.mp3; RS.narrate falls back to the browser voice if a clip cannot play.
   intro: gallery id -> clip; radio: Radio Room reading index -> clip; rooms: gallery id -> clips in room order;
   events: one-off cues; text: captions for the room and event clips. Delete the "rooms" entry to switch room lines off. */
(function(){
'use strict';
window.RS.VOICE={
 intro:{0:1,1:2,2:3,3:4,4:5,5:6,6:7,7:8,9:9},
 radio:[10,11,12,13,14],
 rooms:{"0": [15, 16, 17, 18], "1": [19, 20, 21, 22], "2": [23, 24, 25, 26], "3": [27, 28, 29, 30], "4": [31, 32, 33, 34], "5": [35, 36, 37, 38], "6": [39, 40, 41, 42], "7": [43, 44, 45, 46]},
 events:{quest:47,secret:48,card:49,farewell:50},
 text:{
 "15": "You are standing in the Grand Hall. Every wing of the museum begins here, so take a moment to look around.",
 "16": "This is the Visitor Directory. Use it to find your next quest and to see which galleries you have already explored.",
 "17": "The Museum Store. Nothing here is for sale, but the shelves hold replicas worth a closer look.",
 "18": "The Ticket Desk. Your journey through the nineteen twenties starts with a single step through these doors.",
 "19": "The Hall of Departures. Imagine a family packing what little they own and boarding a northbound train.",
 "20": "The Push and Pull Corridors. On one side, the forces that drove people out of the South. On the other, the hopes that drew them north.",
 "21": "The Gallery of Tensions. New neighbors and new jobs brought new conflict, and not everyone welcomed the change.",
 "22": "A Source Station. Study the evidence carefully, and ask who created it and why.",
 "23": "The Red Scare Hall. Fear of radicals led to arrests, raids, and silence. Notice how quickly fear can limit freedom.",
 "24": "The Palmer Raids Evidence Room. Here, the government's own actions are the evidence.",
 "25": "A Source Station. Compare what the government said with what happened to the people affected.",
 "26": "The Founders' Room. Here you meet the people who decided that civil liberties needed organized defenders.",
 "27": "The Hall of Fear. Look at how newspapers and posters pointed fear at foreigners and radicals.",
 "28": "The Source Analysis Hall. Before you trust a source, ask who made it, when, and for whom.",
 "29": "The Quota and Labor Rooms. Laws about who could enter the country, and who could organize at work, were shaped by fear.",
 "30": "The Trial Room. Weigh the evidence yourself before you decide what justice looked like in these cases.",
 "31": "The Courtroom Lobby. A case that began with a pamphlet would reach the highest court in the land.",
 "32": "The Law Library. Court decisions are built on earlier decisions, so read the reasoning as well as the result.",
 "33": "A Source Station. Read the justices' own words, and notice where they agree and where they do not.",
 "34": "The Incorporation Timeline Hall. Follow the path by which the Bill of Rights began to limit state governments too.",
 "35": "The Temperance Hall. Reformers believed that banning alcohol would make families and communities stronger.",
 "36": "The Enforcement Office. Passing a law is one thing. Enforcing it is another.",
 "37": "The Newsroom. Headlines from the dry years show what people saw, and what they chose to ignore.",
 "38": "The Repeal Hall. After thirteen years, the nation reversed course. Ask yourself why.",
 "39": "The Reading Room. Good historians read widely before they draw conclusions.",
 "40": "The Radio Room. Tune the dial and listen to voices from the past.",
 "41": "The Microfilm Room. Old newspapers were preserved this way, one frame at a time.",
 "42": "The Source Evaluation Desk. Decide whether each source is primary or secondary, then explain your choice.",
 "43": "The Hall of Evidence. Gather the best proof from every gallery you have visited.",
 "44": "The Guiding Questions Atrium. Everything you have learned leads to these two questions.",
 "45": "The Timeline Terrace. Place events in order, and look for the causes that connect them.",
 "46": "The Curator's Office. Your work as a visitor is nearly complete.",
 "47": "Quest complete. You have earned Curator Points.",
 "48": "You found a hidden room. Not every part of history is displayed in plain sight.",
 "49": "This is a Source Card. It tells you who made the source, when, and where. Read it before you decide what it means.",
 "50": "Thank you for visiting The Roaring Society. The questions you explored here still matter today."
}
};
})();
