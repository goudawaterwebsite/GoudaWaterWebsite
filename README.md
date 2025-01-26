# GoudaWater

Welkom bij **GoudaWater**, een webapplicatie voor het beheren van watergerelateerde apparaten (pompen, kleppen, sensoren, etc.) en het inzichtelijk maken van grondwater- en weersinformatie voor de gemeente Gouda. Deze applicatie bestaat uit een **.NET Core (ASP.NET)**-backend en een **React**-frontend.

---

## Inhoudsopgave
1. [Projectstructuur](#projectstructuur)  
2. [Benodigde Software](#benodigde-software)  
3. [Installatie en Configuratie](#installatie-en-configuratie)  
4. [Uitvoeren van het Project](#uitvoeren-van-het-project)  
5. [Authenticatie en Autorisatie](#authenticatie-en-autorisatie)  
6. [Wachtwoord-Hashing](#wachtwoord-hashing)  
7. [Build en Deploy](#build-en-deploy)  
8. [Veelvoorkomende Problemen](#veelvoorkomende-problemen)  
9. [Aanvullende Informatie](#aanvullende-informatie)  

---

## Projectstructuur
```
GoudaWater
├── GoudaWater.sln       # Oplossing (solution) file
├── GoudaWater/          # .NET Core backend project
│   ├── Controllers/     # API Controllers (C#)
│   ├── Data/            # EF Core DbContext en migraties
│   ├── Models/          # Model-klassen (Device, User, etc.)
│   ├── Services/        # Services (ILogic, WaterDataService, etc.)
│   ├── Program.cs       # Applicatie-startup
│   └── ...              # Andere bestanden
└── ClientApp/           # React-frontend (create-react-app)
    ├── public/
    ├── src/
    ├── package.json
    └── ...
```

- **GoudaWater (ASP.NET Core)**: De backend die de MySQL-database aanspreekt, JWT-tokens uitgeeft en de devices bedient.  
- **ClientApp (React)**: De frontend met verschillende pagina’s voor bewoners (User) en de gemeente (Admin).

---

## Benodigde Software

- **.NET 7+**  
  Zorg dat je de .NET 7 SDK geïnstalleerd hebt. Controleer via `dotnet --version`.
- **Node.js** (v16 of hoger)  
  Gebruikt voor het bouwen en draaien van de React-frontend. Controleer via `node --version` en `npm --version`.
- **MySQL** (8.x)  
  Zorg dat je een MySQL-database hebt draaien of een gehoste database (bijv. Azure MySQL).

---

## Installatie en Configuratie

1. **Repository klonen**  
   ```bash
   git clone https://github.com/gebruikersnaam/GoudaWater.git
   cd GoudaWater
   ```

2. **Connectionstrings configureren**  
   Open `appsettings.json` of `appsettings.Development.json` in de GoudaWater-map (het .NET-project).  
   Pas de `DefaultConnection`-string aan naar jouw MySQL-server. Bijvoorbeeld:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "server=localhost;port=3306;database=gouda;user=root;password=xxx;"
     },
     "Jwt": {
       "Secret": "GEHEIME_SLEUTEL_HIER"
     }
   }
   ```
   - `Jwt:Secret` is de symmetrische sleutel voor token-signing. Vervang `GEHEIME_SLEUTEL_HIER` door een sterk geheim (bv. 32 karakters).

3. **NuGet packages installeren (backend)**  
   ```bash
   dotnet restore
   ```

4. **NPM packages installeren (frontend)**  
   ```bash
   cd ClientApp
   npm install
   ```
   Daarna kun je weer terug naar de hoofdmap gaan:
   ```bash
   cd ..
   ```

---

## Uitvoeren van het Project

1. **Database-migraties draaien (optioneel; EF Core)**  
   ```bash
   dotnet ef database update
   ```
   *(Zorg dat je in de project-map staat met de `.csproj`.)*

2. **Backend starten**  
   ```bash
   dotnet run
   ```
   Standaard staat de ASP.NET-app op poort `5000/5001` (of een andere random poort; check de console-output).

3. **Frontend starten**  
   Open een tweede terminal:
   ```bash
   cd ClientApp
   npm start
   ```
   De frontend zal openen op `http://localhost:3000` (of een andere poort).

4. **Toegang**  
   - Ga naar `https://localhost:5001` (secure) of `http://localhost:5000` voor de ASP.NET Core endpoints.
   - Ga naar `http://localhost:3000` voor de React-frontend.

---

## Authenticatie en Autorisatie

- **JWT-tokens**: Bij een succesvolle login (`/api/auth/login`) stuurt de server een token terug. De React-app bewaart deze in `localStorage`.
- **Role-based**:
  - **Admin** mag `/apparaatbeheer`, `/apparaatbediening` en geavanceerde functies.
  - **User** (bewoner) heeft alleen leesrechten over `/home`.

### Voorbeeld
- **Inloggen**: via `http://localhost:3000/login`.
- Na inloggen wordt de token in `localStorage` gezet.

---

## Wachtwoord-Hashing

- **BCrypt**: Bij Register worden wachtwoorden gehasht met BCrypt, bijvoorbeeld:
  ```csharp
  user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
  ```
- Bij Login wordt `BCrypt.Net.BCrypt.Verify(...)` gebruikt om de hash te verifiëren.

---

## Build en Deploy

1. **Production build (frontend)**  
   ```bash
   cd ClientApp
   npm run build
   ```
   Hierdoor wordt in `ClientApp/build` een geoptimaliseerde bundel aangemaakt.

2. **Publiceren .NET project**  
   ```bash
   dotnet publish -c Release -o ./publish
   ```

3. **Archiveren en deployen naar Azure**  
   ```bash
    Compress-Archive -Path .\publish\* -DestinationPath .\publish.zip -Force
   
    az webapp deploy --resource-group goudawater_group --name goudawater --src-path "$PWD\publish.zip" --type zip
   ```

4. **Host in Azure of IIS**  
   - De uitvoerbestanden staan in de `publish`-map.
   - Plaats ze in bijv. een Azure Web App of op IIS (Windows).
   - Vergeet niet je connectionstring en environment-variabelen (JWT-secret) te configureren.

---

## Veelvoorkomende Problemen

1. **CORS-foutmeldingen**
   - Controleer of de frontend-URL in `Program.cs` (`.WithOrigins(...)`) juist is.
   - In dev-mode gebruik je vaak `https://localhost:<poort>` en in productie je eigen domein.

2. **MySQL-verbinding mislukt**
   - Zorg dat de database actief is en poort `3306` openstaat.
   - Check gebruikersnaam/wachtwoord en je `DefaultConnection` in `appsettings.json`.

3. **JWT-gebaseerde 401-fout**
   - Controleer of de token niet verlopen is.
   - Check de `Jwt:Secret` en of de frontend de header `Authorization: Bearer <token>` meestuurt.

4. **NotImplementedException bij `ToggleDeviceAsync`**
   - Deze methode is nog niet (volledig) geïmplementeerd in `DeviceToggleService`.

---

## Aanvullende Informatie

- **RijnlandCheckController**  
  Haalt waterstand en chloride op en beslist of boezemwater mag worden gebruikt.

- **WaterpeilController**  
  Synchroniseert en voorspelt de waterpeil-data, ook via externe API’s zoals Acacia Data.

- **WeatherController**  
  Haalt actuele en historische weersvoorspellingen op via open-meteo.com en weerlive.nl.
```

