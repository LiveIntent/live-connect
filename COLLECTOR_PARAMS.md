## Query parameters in use:

### `aid`
- contains the `appId`
### `did`
- contains the `distributorId`
### `se`
- contains the b64 url encoded string of the JSON that was sent via `liveConnect.push` function
### `duid`
- contains the LiveConnect managed first party identifier, in the `${apexDomainHash}--${ULID}`
### `tv`
- contains the `config.trackerVersion`
### `pu`
- the url on which the event happened, which is populated by the `page` enricher
### `pu_rp`
- a flag that signals when the path of the event url was not collected, it can appear when the `config.urlCollectionMode` config parameter is set to `no_path`.
### `pu_rqp`
- a list of the query parameters that were removed from the event url, based on the `config.queryParametersFilter` config parameter.
### `refr`
- the url of the referrer, which is populated by the `page` enricher
### `ae`
- contains a b64 encoded string of the JSON received on handled exceptions
### `scre`
- if one of the identifiersToResolve contains plain emails, we don't want to send that over the wire, so those are hashed and passed under the `scre` param
### `li_did`
- contains a comma separated list of decision ids extracted from the url and decision storage
### `e`
- similarly to `scre`, some information that is pushed to LiveConnect might contain clear text emails. Those are then hashed and sent under this field
### `wpn`
- `config.wrapperName` value
### `ext_` parameters
- `config.identifiersToResolve` are considered as external, so for each identifier specified and found in any storage level, an additional `ext_` key value pair will be added.
### `us_privacy`
- the value of the `config.usPrivacyString` config parameter.
### `gdpr`
- the value of the `config.gdprApplies` config parameter.
### `gdpr_consent`
- the value of the `config.gdprConsent` config parameter.
### `dtstmp`
- the UTC timestamp when the pixel was sent.
### `c`
- content of contextSelectors matches, concatenated and base64 encoded.
### `gpp_s`
- the value of the `config.gppString` config parameter
### `gpp_as`
- the value of the `config.gppApplicableSections` config parameter
### `ic`
- md5 hash of the resolved id cookie when configuration `config.idCookie` is used. Empty parameter encodes that an
idcookie was configured but failed to resolve.
### `pip`
- contains a b64 encoded string of IPv4 address
### `pip6`
- contains a b64 encoded string of IPv6 address

## Example of a request to a default collectorUrl:
`https://rp.liadm.com/p?tna=v1.0.16&aid=a-00co&lduid=a-00co--bda8cda1-9000-4632-8c64-06e04fa8d113&duid=df9f30ab37f2--01dwcepmbbbqm0hvj4wytvyss4&pu=https%3A%2F%2Fwww.example.com%2F&se=eyJldmVudCI6InZpZXdIb21lUGFnZSJ9&dtstmp=1577968744235`
