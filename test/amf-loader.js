const AmfLoader = {};
AmfLoader.load = function(endpointIndex, operationIndex) {
  endpointIndex = endpointIndex || 0;
  operationIndex = operationIndex || 0;
  const url = location.protocol + '//' + location.host +
    location.pathname.substr(0, location.pathname.lastIndexOf('/'))
    .replace('/test', '/demo') + '/demo-api.json';
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', (e) => {
      let data;
      try {
        data = JSON.parse(e.target.response);
      } catch (e) {
        reject(e);
        return;
      }
      const ns = ApiElements.Amf.ns;
      const enc = data[0][ns.raml.vocabularies.document + 'encodes'][0];
      const ep = enc[ns.raml.vocabularies.http + 'endpoint'][endpointIndex];
      const op = ep[ns.w3.hydra.core + 'supportedOperation'][operationIndex];
      resolve([data, op]);
    });
    xhr.addEventListener('error',
      () => reject(new Error('Unable to load model file')));
    xhr.open('GET', url);
    xhr.send();
  });
};
