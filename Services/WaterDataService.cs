using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System;

public class WaterDataService : IWaterDataService
{
    private readonly IHttpClientFactory _clientFactory;
    private readonly IMemoryCache _cache;

    private const string WaterpeilUrl = "https://services.hydronet.com/hydrowatch/api/chart/project/1362/theme/9653/group/27218";
    private const string ChlorideUrl = "https://services.hydronet.com/hydrowatch/api/chart/project/1362/theme/9711/group/28330";

    public WaterDataService(IHttpClientFactory clientFactory, IMemoryCache cache)
    {
        _clientFactory = clientFactory;
        _cache = cache;
    }

    public async Task<double?> GetLatestWaterpeilValueAsync()
    {
        if (_cache.TryGetValue<double?>("latestWaterpeilValue", out var cachedValue))
        {
            return cachedValue;
        }

        var lastValue = await ExtractLastValueFromApi(WaterpeilUrl);
        if (lastValue != null)
        {
            _cache.Set("latestWaterpeilValue", lastValue, TimeSpan.FromMinutes(5));
        }

        return lastValue;
    }

    public async Task<double?> GetLatestChlorideValueAsync()
    {
        if (_cache.TryGetValue<double?>("latestChlorideValue", out var cachedValue))
        {
            return cachedValue;
        }

        var lastValue = await ExtractLastValueFromApi(ChlorideUrl);
        if (lastValue != null)
        {
            _cache.Set("latestChlorideValue", lastValue, TimeSpan.FromMinutes(5));
        }

        return lastValue;
    }

    private async Task<double?> ExtractLastValueFromApi(string url)
    {
        var client = _clientFactory.CreateClient();
        var html = await client.GetStringAsync(url);

        var seriesPattern = @"series:\s*\[\s*\{\s*data:\s*(\[\[.*?\]\])";
        var match = Regex.Match(html, seriesPattern, RegexOptions.Singleline);
        if (!match.Success)
        {
            return null;
        }

        var dataArrayString = match.Groups[1].Value;
        var dataArray = JArray.Parse(dataArrayString);
        if (dataArray.Count == 0)
        {
            return null;
        }

        var lastDataPoint = dataArray[dataArray.Count - 1];
        if (lastDataPoint is JArray lastArray && lastArray.Count > 1)
        {
            return (double)lastArray[1];
        }

        return null;
    }
}
