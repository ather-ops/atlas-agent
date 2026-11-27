import json


class ServiceError(Exception):
    pass


class ServiceCredentialError(ServiceError):
    pass


async def request_json(client, method, url, **kwargs):
    async with client.stream(method, url, timeout=12, **kwargs) as r:
        if r.status_code in (401, 403):
            raise ServiceCredentialError(
                "This service rejected its credentials. Reconfigure the integration."
            )
        if r.status_code >= 400:
            raise ServiceError(
                "The service rejected the request. Check its key, quota and permissions."
            )
        data = bytearray()
        async for chunk in r.aiter_bytes():
            data.extend(chunk)
            if len(data) > 512000:
                raise ServiceError("The service returned too much data.")
        return json.loads(data)


async def search(client, key, query):
    d = await request_json(
        client,
        "POST",
        "https://api.tavily.com/search",
        headers={"Authorization": f"Bearer {key}"},
        json={
            "query": query,
            "max_results": 4,
            "search_depth": "basic",
            "include_raw_content": False,
        },
    )
    rows = []
    for item in d["results"][:4]:
        url = str(item["url"])[:1200]
        if url.startswith(("https://", "http://")):
            rows.append(f"{str(item['title'])[:200]}\n{url}\n{str(item.get('content', ''))[:700]}")
    return "\n\n".join(rows) or "No matching results."


async def weather(client, key, city):
    d = await request_json(
        client,
        "GET",
        "https://api.openweathermap.org/data/2.5/weather",
        params={"q": city, "appid": key, "units": "metric"},
    )
    return f"{d['name']}: {d['main']['temp']} °C, {str(d['weather'][0]['description'])[:100]}. Humidity {d['main']['humidity']}%. Wind {d['wind']['speed']} m/s."
