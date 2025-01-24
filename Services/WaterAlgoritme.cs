using System;
using System.Collections.Generic;
using System.Linq;

namespace GoudaWater.Services
{

    public class WaterAlgoritme
    {
        private double _intercept; 
        private double _coef;   

        private bool _isTrained = false;

        public void Train(List<(double precipitation, double waterpeil)> trainingData)
        {
            if (trainingData == null || trainingData.Count < 2)
                throw new ArgumentException("Onvoldoende trainingsdata");

            double avgRain = trainingData.Average(d => d.precipitation);
            double avgWater = trainingData.Average(d => d.waterpeil);

            double numerator = trainingData.Sum(d => (d.precipitation - avgRain) * (d.waterpeil - avgWater));
            double denominator = trainingData.Sum(d => Math.Pow(d.precipitation - avgRain, 2));

            if (denominator == 0)
            {
                _coef = 0;
            }
            else
            {
                _coef = numerator / denominator;
            }

            _intercept = avgWater - _coef * avgRain;

            _isTrained = true;
        }

        public double Predict(double predictedPrecipitation)
        {
            if (!_isTrained)
                throw new InvalidOperationException("Model is niet getraind.");

            return _intercept + _coef * predictedPrecipitation;
        }
    }
}
