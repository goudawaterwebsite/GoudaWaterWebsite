public interface IWaterDataService
{
    Task<double?> GetLatestWaterpeilValueAsync();
    Task<double?> GetLatestChlorideValueAsync();
}
