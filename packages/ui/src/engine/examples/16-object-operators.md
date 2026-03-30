# Object Operators

---

## $get — read a dynamic key

```json
{
  "$get": {
    "from": { "$ref": "page.store:config" },
    "key":  { "$ref": "page.store:activeKey" }
  }
}
```

```js
state.config[state.activeKey]
```

---

## $keys / $values / $entries

```json
{ "$keys":    { "$ref": "page.store:settings" } }
{ "$values":  { "$ref": "page.store:settings" } }
{ "$entries": { "$ref": "page.store:settings" } }
```

```js
Object.keys(state.settings)
Object.values(state.settings)
Object.entries(state.settings)
```

---

## $merge — combine objects

```json
{
  "$merge": [
    { "$ref": "page.store:defaults" },
    { "$ref": "page.store:overrides" }
  ]
}
```

```js
{ ...state.defaults, ...state.overrides }
```

---

## $pick — keep specific keys

```json
{
  "$pick": {
    "from": { "$ref": "page.store:user" },
    "keys": ["name", "email", "avatar"]
  }
}
```

```js
const { name, email, avatar } = state.user
// or: Object.fromEntries(["name","email","avatar"].map(k => [k, state.user[k]]))
```

---

## $omit — drop specific keys

```json
{
  "$omit": {
    "from": { "$ref": "page.store:user" },
    "keys": ["password", "token"]
  }
}
```

```js
const { password, token, ...safeUser } = state.user
```

---

## $has — check key existence

```json
{ "$has": { "obj": { "$ref": "page.store:cache" }, "key": { "$ref": "page.store:requestId" } } }
```

```js
state.requestId in state.cache
```

---

## $json / $parse — JSON serialization

```json
{ "$json": { "$ref": "page.store:payload" } }
```

```js
JSON.stringify(state.payload)
// returns null on error
```

---

```json
{ "$parse": { "$ref": "page.store:rawJson" } }
```

```js
JSON.parse(state.rawJson)
// returns null on parse error; safe to use on untrusted strings
```

---

## Build display object from multiple refs

```json
{
  "component": "ProfileCard",
  "env": {
    "displayData": {
      "$merge": [
        { "$pick": { "from": { "$ref": "page.store:user" }, "keys": ["name", "avatar"] } },
        {
          "role": {
            "$switch": {
              "on": { "$ref": "page.store:user.role" },
              "cases": { "admin": "Administrator", "editor": "Editor" },
              "default": "Viewer"
            }
          }
        }
      ]
    }
  },
  "props": { "data": { "$ref": "var:displayData" } }
}
```

```js
const displayData = {
  name:   state.user.name,
  avatar: state.user.avatar,
  role:   { admin: "Administrator", editor: "Editor" }[state.user.role] ?? "Viewer",
}
<ProfileCard data={displayData} />
```

---

## Iterating object entries with $map

```json
{
  "component": "SettingsGrid",
  "children": [
    {
      "$map": {
        "over": { "$entries": { "$ref": "page.store:settings" } },
        "as": "entry",
        "return": {
          "component": "P",
          "children": [
            { "$get": { "from": { "$ref": "var:entry" }, "key": "0" } },
            ": ",
            { "$get": { "from": { "$ref": "var:entry" }, "key": "1" } }
          ]
        }
      }
    }
  ]
}
```

```jsx
Object.entries(state.settings).map(([label, value]) => (
  <SettingRow label={label} value={value} />
))
```
