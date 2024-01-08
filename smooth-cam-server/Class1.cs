using System;
using AltV.Net;
using AltV.Net.Elements.Entities;
using AltV.Net.Enums;
using MongoDB;
using MongoDB.Driver;
using MongoDB.Bson;

struct PlayerPosition {
    public double x;
    public double y;
    public double z;
}

struct PlayerRotation {
    public double x;
    public double y;
    public double z;
}

namespace ExampleProject
{
    internal class ExampleResource : Resource
    {
        public override void OnStart()
        {
            Console.WriteLine("Started");
            Alt.OnPlayerCustomEvent += (player, eventName, args) => HandleSaveCoords(player, args);
        }

        public override void OnStop() 
        {
            Console.WriteLine("Stopped");
        }

        private void HandleSaveCoords(IPlayer player, AltV.Net.Elements.Args.MValueConst[] args) {

            string[] PlayerPosition = (args[0].GetDictionary().GetValueOrDefault("position").ToString())[15..].Split(",");
            string[] PlayerRotation = (args[0].GetDictionary().GetValueOrDefault("rotation").ToString())[15..].Split(",");
            PlayerPosition[2] = PlayerPosition[2].Remove(PlayerPosition[2].Length - 2);
            PlayerRotation[2] = PlayerRotation[2].Remove(PlayerRotation[2].Length - 2);

            PlayerPosition playerPosition = new PlayerPosition();
            playerPosition.x = Convert.ToDouble(PlayerPosition[0]);
            playerPosition.y = Convert.ToDouble(PlayerPosition[1]);
            playerPosition.z = Convert.ToDouble(PlayerPosition[2]);

            PlayerRotation playerRotation = new PlayerRotation();
            playerRotation.x = Convert.ToDouble(PlayerRotation[0]);
            playerRotation.y = Convert.ToDouble(PlayerRotation[1]);
            playerRotation.z = Convert.ToDouble(PlayerRotation[2]);

            var client = new MongoClient("mongodb://localhost:27017");
            var database = client.GetDatabase("altv");
            var collection = client.GetDatabase("altv").GetCollection<BsonDocument>("cameras");

            var document = new BsonDocument {
                { "position", new BsonDocument {
                    { "x", playerPosition.x },
                    { "y", playerPosition.y },
                    { "z", playerPosition.z }
                }},
                { "rotation", new BsonDocument {
                    { "x", playerRotation.x },
                    { "y", playerRotation.y },
                    { "z", playerRotation.z }
                }}
            };

            collection.InsertOne(document);
            Alt.Emit("SmoothDirectorCam:SavedCoords");
        }
    }
}