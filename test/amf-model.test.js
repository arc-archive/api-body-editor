import { assert, aTimeout, fixture, html, nextFrame } from '@open-wc/testing'
import { AmfLoader } from './amf-loader.js'
import * as sinon from 'sinon/pkg/sinon-esm.js'
import '../api-body-editor.js'

describe('<api-body-editor>', function() {
  async function basicFixture() {
    return await fixture(html `
      <api-body-editor></api-body-editor>
    `);
  }

  [
    ['Full model', false],
    ['Compact model', true]
  ].forEach(([label, compact]) => {
    describe(label, () => {
      describe('Setting the model', () => {
        let amf;
        let body;
        let element;
        before(async () => {
          [amf, body] = await AmfLoader.loadOperation(compact, '/people', 'post');
        });

        beforeEach(async () => {
          element = await basicFixture();
          element.amf = amf;
        });

        it('calls __processAmfData() after a timeout', async () => {
          element.amfBody = body;
          const spy = sinon.spy(element, '__processAmfData');
          await aTimeout();
          assert.isTrue(spy.called);
        });

        it('sets _effectiveModel', async () => {
          element.amfBody = body;
          await aTimeout();
          assert.typeOf(element._effectiveModel, 'array');
        });

        it('clears _panelModel when no body', async () => {
          element.amfBody = body;
          await aTimeout();
          element._panelModel = [{}];
          element.amfBody = undefined;
          await aTimeout();
          assert.isUndefined(element._panelModel);
        });

        it('clears _panelModel when no valid model', async () => {
          element.amfBody = body;
          await aTimeout();
          element._panelModel = [{}];
          element.amfBody = [{}];
          await aTimeout();
          assert.isUndefined(element._panelModel);
        });
      });

      describe('Body mime type selector', () => {
        let amf;
        let element;
        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await basicFixture();
          element.amf = amf;
        });

        it('renders the selector', async () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          const node = element.shadowRoot.querySelector('.amf-types');
          assert.ok(node);
        });

        it('sets media types', async () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.deepEqual(element._mimeTypes, ['application/json', 'application/xml']);
        });

        it('sets _singleMimeType for multiple types', async () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.isFalse(element._singleMimeType);
        });

        it('does not render the selector for single mime', async () => {
          const body = AmfLoader.lookupOperation(amf, '/messages', 'post');
          element.amfBody = body;
          await aTimeout();
          const node = element.shadowRoot.querySelector('.amf-types');
          assert.notOk(node);
        });

        it('sets single media type', async () => {
          const body = AmfLoader.lookupOperation(amf, '/messages', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.deepEqual(element._mimeTypes, ['application/json']);
        });

        it('sets _singleMimeType for signle type', async () => {
          const body = AmfLoader.lookupOperation(amf, '/messages', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.isTrue(element._singleMimeType);
        });
      });

      describe('Media type auto selection', () => {
        let amf;
        let element;
        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await basicFixture();
          element.amf = amf;
        });

        it('selectes first media type', async () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.equal(element.contentType, 'application/json');
        });

        it('keeps current contentType if possible', async () => {
          element.contentType = 'application/xml';
          await nextFrame();
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.equal(element.contentType, 'application/xml');
        });

        it('sets application/octet-stream for file type', async () => {
          const body = AmfLoader.lookupOperation(amf, '/files/file', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.equal(element.contentType, 'application/octet-stream');
        });

        it('sets fileAccept if defined', async () => {
          const body = AmfLoader.lookupOperation(amf, '/files/file', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.deepEqual(element.fileAccept, ['image/png']);
        });

        it('clears fileAccept for other media types', async () => {
          element.fileAccept = ['image/png'];
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.isUndefined(element.fileAccept);
        });

        it('calls _notifyContentTypeChange()', async () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          const spy = sinon.spy(element, '_notifyContentTypeChange');
          await aTimeout();
          assert.isTrue(spy.called);
        });
      });

      describe('_ensurePayloadModel()', () => {
        let amf;
        let element;
        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await basicFixture();
          element.amf = amf;
        });

        it('returns a payload for operation', () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          const result = element._ensurePayloadModel(body);
          assert.typeOf(result, 'array');
        });

        it('returns a payload when payload model already passed', () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          const result = element._ensurePayloadModel(body);
          const final = element._ensurePayloadModel(result);
          assert.typeOf(final, 'array');
        });

        it('returns undefined when no argument', () => {
          const result = element._ensurePayloadModel();
          assert.isUndefined(result);
        });

        it('returns undefined when body definition in the model', () => {
          const body = AmfLoader.lookupOperation(amf, '/no-body', 'get');
          const result = element._ensurePayloadModel(body);
          assert.isUndefined(result);
        });
      });

      describe('Value setting', () => {
        let amf;
        let element;
        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await basicFixture();
          element.amf = amf;
          await nextFrame();
        });

        it('sets value from example / JSON', async () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          const data = JSON.parse(element.value);
          assert.equal(data.name, 'Pawel Psztyc');
        });

        it('sets value after changin mime type', async () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          element.contentType = 'application/xml';
          assert.include(element.value, '<name>John Smith</name>');
        });

        it('sets value after body change', async () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          const body2 = AmfLoader.lookupOperation(amf, '/products', 'post');
          element.amfBody = body2;
          await aTimeout();
          const data = JSON.parse(element.value);
          assert.equal(data.name, 'Acme Product');
        });

        it('sets x-www-urlencoded value', async () => {
          const body = AmfLoader.lookupOperation(amf, '/urlencoded', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.include(element.value, 'etag: "W\\\\sd3deef3rgrgf4r"');
        });

        it('sets value from property inline examples', async () => {
          const body = AmfLoader.lookupOperation(amf, '/ramlTypeTest', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.include(element.value, '"newProperty": "This is a new DataType",');
        });

        it('sets value when no examples', async () => {
          const body = AmfLoader.lookupOperation(amf, '/no-examples', 'put');
          element.amfBody = body;
          await aTimeout();
          const value = JSON.parse(element.value);
          assert.deepEqual(value, {
            prop1: '',
            prop2: 0,
            prop3: 0
          });
        });

        it('sets first example if multiple', async () => {
          const body = AmfLoader.lookupOperation(amf, '/messages/bulk', 'post');
          element.amfBody = body;
          await aTimeout();
          const value = JSON.parse(element.value);
          assert.lengthOf(value, 2);
        });
      });

      describe('Model setting', () => {
        let amf;
        let element;
        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await basicFixture();
          element.amf = amf;
          await nextFrame();
        });

        it('sets model for form data', async () => {
          const body = AmfLoader.lookupOperation(amf, '/urlencoded', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.typeOf(element._panelModel, 'array');
          assert.lengthOf(element._panelModel, 7);
        });

        it('sets model for union form data', async () => {
          const body = AmfLoader.lookupOperation(amf, '/union', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.typeOf(element._panelModel, 'array');
          assert.lengthOf(element._panelModel, 6);
        });

        it('sets model for multipart data', async () => {
          const body = AmfLoader.lookupOperation(amf, '/files/multipart', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.typeOf(element._panelModel, 'array');
          assert.lengthOf(element._panelModel, 2);
        });

        it('does not set model for raw editor', async () => {
          const body = AmfLoader.lookupOperation(amf, '/people', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.isUndefined(element._panelModel);
        });

        it('does not set model for file editor', async () => {
          const body = AmfLoader.lookupOperation(amf, '/files/file', 'post');
          element.amfBody = body;
          await aTimeout();
          assert.isUndefined(element._panelModel);
        });
      });
    });

    describe('APIC-480', () => {
      let amf;
      let element;

      before(async () => {
        amf = await AmfLoader.load(compact, 'APIC-480');
      });

      beforeEach(async () => {
        element = await basicFixture();
        element.amf = amf;
      });

      describe('Get operation', () => {
        let body;
        beforeEach(async () => {
          body = AmfLoader.lookupOperation(amf, '/accounts/{accountNumber}', 'get');
          element.amfBody = body;
          await aTimeout()
        });

        it('returns a payload for operation', () => {
          const result = element._ensurePayloadModel(body);
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 1);
        });

        it('sets media types for operation',  () => {
          assert.deepEqual(element._mimeTypes, ['application/json']);
        });

        it('selects first media type',  () => {
          assert.equal(element.contentType, 'application/json');
        });
      })

      describe('Patch operation', () => {
        let body;
        beforeEach(async () => {
          body = AmfLoader.lookupOperation(amf, '/accounts/{accountNumber}', 'patch');
          element.amfBody = body;
          await aTimeout()
        });

        it('returns a payload for operation', () => {
          const result = element._ensurePayloadModel(body);
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 1);
        });

        it('sets media types for operation', () => {
          assert.deepEqual(element._mimeTypes, ['application/json']);
        });

        it('selects first media type',  () => {
          assert.equal(element.contentType, 'application/json');
        });
      })
    })
  });

  describe('a11y', () => {
    let amf;
    let element;
    before(async () => {
      amf = await AmfLoader.load(true);
    });

    beforeEach(async () => {
      element = await basicFixture();
      element.amf = amf;
      await nextFrame();
    });

    it('is accessible for multiple mime types', async () => {
      const body = AmfLoader.lookupOperation(amf, '/people', 'post');
      element.amfBody = body;
      await aTimeout();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });

    it('is accessible for single mime type', async () => {
      const body = AmfLoader.lookupOperation(amf, '/messages', 'post');
      element.amfBody = body;
      await aTimeout();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });

    it('is accessible for a file', async () => {
      const body = AmfLoader.lookupOperation(amf, '/files/file', 'post');
      element.amfBody = body;
      await aTimeout();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });

    it('is accessible for multipart data', async () => {
      const body = AmfLoader.lookupOperation(amf, '/files/multipart', 'post');
      element.amfBody = body;
      await aTimeout();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });
  });
});
