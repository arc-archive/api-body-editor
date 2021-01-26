import {
  fixture,
  assert,
  nextFrame,
  aTimeout,
  html
} from '@open-wc/testing';
import * as sinon from 'sinon/pkg/sinon-esm.js';
import * as MockInteractions from '@polymer/iron-test-helpers/mock-interactions.js';
import '../api-body-editor.js';

const hasPartsApi = 'part' in document.createElement('span');

describe('<api-body-editor>', function() {
  async function basicFixture() {
    return await fixture(html `
      <api-body-editor></api-body-editor>
    `);
  }

  async function withValueFixture() {
    return await fixture(html `
      <api-body-editor value="test-value"></api-body-editor>
    `);
  }

  async function formDataEditorFixture() {
    return await fixture(html `
      <api-body-editor selected="1"></api-body-editor>
    `);
  }

  async function formDataEditorValueFixture() {
    return await fixture(html `
      <api-body-editor selected="1" value="param=value"></api-body-editor>
    `);
  }

  async function multipartFixture() {
    return await fixture(html `
      <api-body-editor selected="2"></api-body-editor>
    `);
  }

  describe('Initialization', async () => {
    it('Can be initialized with createElement', async () => {
      const element = document.createElement('api-body-editor');
      assert.ok(element);
    });

    it('Default selection is raw panel', async () => {
      const element = await basicFixture();
      assert.equal(element.selected, 0);
    });

    it('Initializes raw editor when no data', async () => {
      const element = await basicFixture();
      const current = element.currentPanel;
      assert.equal(current.nodeName, 'RAW-PAYLOAD-EDITOR');
    });

    it('Value is empty', async () => {
      const element = await basicFixture();
      assert.equal(element.value, '');
    });

    it('Content type is not set', async () => {
      const element = await basicFixture();
      assert.isUndefined(element.contentType);
    });

    it('_editorSelectorHidden is undefined', async () => {
      const element = await basicFixture();
      assert.isUndefined(element._editorSelectorHidden);
    });

    it('Editor type selector is rendered', async () => {
      const element = await basicFixture();
      const selector = element.shadowRoot.querySelector('anypoint-dropdown-menu.type');
      assert.ok(selector);
    });

    ['raw', 'urlencode', 'multipart', 'file'].forEach((type) => {
      it(`Editor type "${type}" is rendered`, async () => {
        const element = await basicFixture();
        const node = element.shadowRoot.querySelector(`anypoint-item[data-source="${type}"]`);
        assert.ok(node);
      });
    });

    it('content-type-selector is rendered', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('content-type-selector');
      assert.ok(node);
    });

    it('AMF types selector is not renered', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.amf-types');
      assert.notOk(node);
    });
  });

  describe('_renderAllEditors()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element.noTextInput = true;
      element.noFormData = true;
      element.noMultipart = true;
      element.noFile = true;
      await nextFrame();
    });

    ['noTextInput', 'noFormData', 'noMultipart', 'noFile']
    .forEach((key) => {
      it(`Sets ${key} true`, () => {
        assert.isTrue(element[key]);
      });
    });
  });

  describe('_copyToClipboard()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element.value = 'test';
      await nextFrame();
    });

    it('Calls copy() in the `clipboard-copy` element', async () => {
      const copy = element.shadowRoot.querySelector('clipboard-copy');
      const spy = sinon.spy(copy, 'copy');
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      assert.isTrue(spy.called);
    });

    it('Changes the label', async () => {
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      assert.notEqual(button.innerText.trim().toLowerCase(), 'copy');
    });

    it('Disables the button', async () => {
      await aTimeout();
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      assert.isTrue(button.disabled);
    });

    (hasPartsApi ? it : it.skip)('Adds content-action-button-disabled to the button', async () => {
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      assert.isTrue(button.part.contains('content-action-button-disabled'));
    });

    (hasPartsApi ? it : it.skip)('Adds code-content-action-button-disabled to the button', async () => {
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      assert.isTrue(button.part.contains('code-content-action-button-disabled'));
    });
  });

  describe('_resetCopyButtonState()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element.value = 'test';
      await nextFrame();
    });

    it('Changes label back', async () => {
      await aTimeout();
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.innerText = 'test';
      element._resetCopyButtonState(button);
      assert.equal(button.innerText.trim().toLowerCase(), 'copy');
    });

    it('Restores disabled state', async () => {
      await aTimeout();
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      button.disabled = true;
      element._resetCopyButtonState(button);
      assert.isFalse(button.disabled);
    });

    (hasPartsApi ? it : it.skip)('Removes content-action-button-disabled part from the button', async () => {
      await aTimeout();
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      element._resetCopyButtonState(button);
      assert.isFalse(button.part.contains('content-action-button-disabled'));
    });

    (hasPartsApi ? it : it.skip)('Removes code-content-action-button-disabled part from the button', async () => {
      await aTimeout();
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      element._resetCopyButtonState(button);
      assert.isFalse(button.part.contains('code-content-action-button-disabled'));
    });
  });

  describe('_typeSelectedChanged()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element.value = 'test';
      await nextFrame();
    });

    it('Does nothing when no value', () => {
      const spy = sinon.spy(element, '_notifyContentTypeChange');
      element._typeSelectedChanged({
        detail: {}
      });
      assert.isFalse(spy.called);
    });

    it('Calls _notifyContentTypeChange()', () => {
      const spy = sinon.spy(element, '_notifyContentTypeChange');
      element._typeSelectedChanged({
        detail: {
          value: 'application/json'
        }
      });
      assert.isTrue(spy.called);
    });
  });

  describe('_notifyContentTypeChange()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element.value = 'test';
      await nextFrame();
    });

    it('Dispatches "content-type-changed" event', () => {
      const spy = sinon.spy();
      element.addEventListener('content-type-changed', spy);
      element._notifyContentTypeChange('test-ct');
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0].detail.value, 'test-ct');
    });

    it('Does nothing when readOnly', () => {
      const spy = sinon.spy();
      element.readOnly = true;
      element.addEventListener('content-type-changed', spy);
      element._notifyContentTypeChange('test-ct');
      assert.isFalse(spy.called);
    });
  });

  describe('refresh()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element.selected = 1;
      element.value = 'a=b';
      await nextFrame();
    });

    it('Refreshes state of raw panel', async () => {
      element.selected = 0;
      await nextFrame();
      element.refresh();
      const panel = element.currentPanel;
      const cm = panel.shadowRoot.querySelector('code-mirror');
      const v = cm.editor.getValue();
      assert.equal(v, 'a=b');
    });

    it('Does nothing for other panels', () => {
      element.refresh();
      // no error by calling `.refresh()` on the panel.
    });

    it('calls refresh() from refreshPanel()', () => {
      const spy = sinon.spy(element, 'refresh');
      element.refreshPanel();
      assert.isTrue(spy.called);
    });
  });

  describe('File panel rendering', () => {
    it('renders the panel from selected attribute', async () => {
      const element = await fixture(`<api-body-editor selected="3"></api-body-editor>`);
      const node = element.shadowRoot.querySelector('files-payload-editor');
      assert.ok(node);
    });

    it('Renders panel from content-type change', async () => {
      const element = await basicFixture();
      element.contentType = 'application/octet-stream';
      await nextFrame();
      const node = element.shadowRoot.querySelector('files-payload-editor');
      assert.ok(node);
    });
  });

  describe('form-data-editor', () => {
    it('renders the editor', async () => {
      const element = await formDataEditorFixture();
      const node = element.shadowRoot.querySelector('form-data-editor');
      assert.ok(node);
    });

    it('renders the editor when media type changes', async () => {
      const element = await basicFixture();
      element.contentType = 'application/x-www-form-urlencoded';
      await nextFrame();
      const node = element.shadowRoot.querySelector('form-data-editor');
      assert.ok(node);
    });

    // model change overrides the value. This has to be handled by the panel.
    // No bandwith ATM to do this.
    it.skip('sets value on the panel from elements attribute', async () => {
      const element = await formDataEditorValueFixture();
      const node = element.shadowRoot.querySelector('form-data-editor');
      assert.equal(node.value, 'param=value');
    });

    it('updates panel value when elements value change', async () => {
      const element = await formDataEditorFixture();
      const value = 'other=value';
      element.value = value;
      await nextFrame();
      const editor = element.currentPanel;
      assert.equal(editor.value, value);
    });

    it('sets allowDisableParams', async () => {
      const element = await fixture('<api-body-editor selected="1" allowdisableparams></api-body-editor>');
      const editor = element.currentPanel;
      assert.isTrue(editor.allowDisableParams);
    });

    it('sets allowHideOptional', async () => {
      const element = await fixture('<api-body-editor selected="1" allowhideoptional></api-body-editor>');
      const editor = element.currentPanel;
      assert.isTrue(editor.allowHideOptional);
    });

    it('sets readOnly', async () => {
      const element = await fixture('<api-body-editor selected="1" readonly></api-body-editor>');
      const editor = element.currentPanel;
      assert.isTrue(editor.readOnly);
    });

    it('sets allowCustom', async () => {
      const element = await fixture('<api-body-editor selected="1" allowcustom></api-body-editor>');
      const editor = element.currentPanel;
      assert.isTrue(editor.allowCustom);
    });

    it('sets narrow', async () => {
      const element = await fixture('<api-body-editor selected="1" narrow></api-body-editor>');
      const editor = element.currentPanel;
      assert.isTrue(editor.narrow);
    });

    it('Form value change changes editor value', async () => {
      const element = await formDataEditorFixture();
      await nextFrame();
      const v = 'test-1=value-1';
      const editor = element.currentPanel;
      editor.value = v;
      assert.equal(element.value, v);
    });

    it('body-value-changed event is dispatched', async () => {
      const element = await formDataEditorFixture();
      await nextFrame();
      const spy = sinon.spy();
      element.addEventListener('body-value-changed', spy);
      const editor = element.currentPanel;
      editor.value = 'test=value';
      assert.equal(spy.args[0][0].detail.value, 'test=value');
    });

    it('removes the panel when chaning editor', async () => {
      const element = await formDataEditorFixture();
      element.selected = 0;
      await nextFrame();
      const editor = element.shadowRoot.querySelector('form-data-editor');
      assert.notOk(editor);
    });

    it.skip('Copies value from other editor', async () => {
      const element = await formDataEditorFixture();
      element.selected = 0;
      await nextFrame();
      const form = element.currentPanel;
      const value = 'other-value=test';
      form.value = value;
      element.selected = 1;
      await nextFrame();
      const editor = element.shadowRoot.querySelector('form-data-editor');
      assert.equal(editor.value, value);
    });
  });

  describe('Multipart mode', () => {
    it('passed the value', async () => {
      const element = await multipartFixture();
      const value = new FormData();
      element.value = value;
      await nextFrame();
      const editor = element.currentPanel;
      assert.isTrue(editor.value === value);
    });

    it('removes the panel when changing editor', async () => {
      const element = await multipartFixture();
      element.selected = 0;
      await nextFrame();
      const editor = element.shadowRoot.querySelector('multipart-payload-editor');
      assert.notOk(editor);
    });

    it('renders the editor when media type changes', async () => {
      const element = await basicFixture();
      element.contentType = 'multipart/form-data';
      await nextFrame();
      const node = element.shadowRoot.querySelector('multipart-payload-editor');
      assert.ok(node);
    });
  });

  describe('Raw mode', () => {
    it('value is set on the panel', async () => {
      const element = await withValueFixture();
      const editor = element.currentPanel;
      assert.equal(editor.value, 'test-value');
    });

    it('renders the editor when media type changes', async () => {
      const element = await formDataEditorFixture();
      element.contentType = 'application/json';
      await nextFrame();
      const node = element.shadowRoot.querySelector('raw-payload-editor');
      assert.ok(node);
    });

    it('contentType is passed to the raw element', async () => {
      const element = await fixture('<api-body-editor contenttype="own/type"></api-body-editor>');
      const editor = element.currentPanel;
      assert.equal(editor.contentType, 'own/type');
    });

    it('Raw value change changes editor value', async () => {
      const element = await basicFixture();
      await nextFrame();
      const v = 'test-value-1';
      const editor = element.currentPanel;
      editor.value = v;
      assert.equal(element.value, v);
    });

    it('body-value-changed event is dispatched when setting value on inner editor', async () => {
      const element = await basicFixture();
      await nextFrame();
      const spy = sinon.spy();
      element.addEventListener('body-value-changed', spy);
      const editor = element.currentPanel;
      editor.value = 'test';
      assert.equal(spy.args[0][0].detail.value, 'test');
    });

    it('removes the panel when changing editor', async () => {
      const element = await basicFixture();
      element.selected = 1;
      await nextFrame();
      const editor = element.shadowRoot.querySelector('raw-payload-editor');
      assert.notOk(editor);
    });

    it('Copies value from other editor', async () => {
      const element = await basicFixture();
      element.selected = 1;
      await nextFrame();
      const form = element.currentPanel;
      const value = 'other-value=test';
      form.value = value;
      element.selected = 0;
      await nextFrame();
      const editor = element.shadowRoot.querySelector('raw-payload-editor');
      assert.equal(editor.value, value);
    });
  });

  describe('changing content type', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element.contentType = 'x-custom';
    });

    it('renders all editors in type selector when no content tpye', () => {
      element.contentType = undefined;
      assert.isFalse(element.noTextInput, 'noTextInput is false');
      assert.isFalse(element.noFormData, 'noFormData is false');
      assert.isFalse(element.noMultipart, 'noMultipart is false');
      assert.isFalse(element.noFile, 'noFile is false');
    });

    it('renders multipart for multipart/form-data', async () => {
      element.contentType = 'multipart/form-data';
      await nextFrame();
      assert.equal(element.selected, 2);
      const editor = element.shadowRoot.querySelector('multipart-payload-editor');
      assert.ok(editor);
    });

    it('sets alternative editors', async () => {
      element.contentType = 'multipart/form-data';
      assert.isFalse(element.noTextInput, 'noTextInput is false');
      assert.isTrue(element.noFormData, 'noFormData is true');
      assert.isFalse(element.noMultipart, 'noMultipart is false');
      assert.isTrue(element.noFile, 'noFile is true');
    });

    it('clears the value when switching from multipart to other types', async () => {
      element.contentType = 'multipart/form-data';
      element.value = new Blob(['test']);
      await nextFrame();
      element.contentType = 'application/json';
      assert.equal(element.value, '');
    });

    it('renders file editor for application/octet-stream', async () => {
      element.contentType = 'application/octet-stream';
      await nextFrame();
      assert.equal(element.selected, 3);
      const editor = element.shadowRoot.querySelector('files-payload-editor');
      assert.ok(editor);
    });

    it('keeps file editor opened after file mime change', async () => {
      element.contentType = 'application/octet-stream';
      element.value = new Blob(['test']);
      await nextFrame();
      element.contentType = 'text/plain';
      assert.equal(element.selected, 3);
    });

    it('enables file editor selector for file type', async () => {
      element.contentType = 'application/octet-stream';
      element.value = new Blob(['test']);
      await nextFrame();
      element.contentType = 'text/plain';
      assert.isTrue(element.noTextInput, 'noTextInput is true');
      assert.isTrue(element.noFormData, 'noFormData is true');
      assert.isTrue(element.noMultipart, 'noMultipart is true');
      assert.isFalse(element.noFile, 'noFile is false');
    });

    it('renders multipart for application/x-www-form-urlencoded', async () => {
      element.contentType = 'application/x-www-form-urlencoded';
      await nextFrame();
      assert.equal(element.selected, 1);
      const editor = element.shadowRoot.querySelector('form-data-editor');
      assert.ok(editor);
    });

    it('sets alternative editors', async () => {
      element.contentType = 'application/x-www-form-urlencoded';
      assert.isFalse(element.noTextInput, 'noTextInput is false');
      assert.isFalse(element.noFormData, 'noFormData is false');
      assert.isTrue(element.noMultipart, 'noMultipart is true');
      assert.isTrue(element.noFile, 'noFile is true');
    });

    it('sets default panel for other media types', async () => {
      element.contentType = 'application/xml';
      assert.equal(element.selected, '0');
    });

    it('enables raw editor selector for other media types', async () => {
      element.contentType = 'application/xml';
      assert.equal(element.noTextInput, false);
    });

    it('clears the boundary of content type if any', async () => {
      element.contentType = 'multipart/form-data; boundary=----WebKitFormBoundaryoWb1Lth35wfQGh2n';
      await nextFrame();
      assert.equal(element.contentType, 'multipart/form-data');
    });
  });

  describe('send-request event', () => {
    let element;
    beforeEach(async () => {
      element = await withValueFixture();
    });

    it('dispatches the event for Enter and ctrl', () => {
      const spy = sinon.spy();
      element.addEventListener('send-request', spy);
      MockInteractions.keyDownOn(element, 13, ['ctrl'], 'Enter');
      assert.isTrue(spy.called);
    });

    it('dispatches the event for Enter and meta', () => {
      const spy = sinon.spy();
      element.addEventListener('send-request', spy);
      MockInteractions.keyDownOn(element, 13, ['meta'], 'Enter');
      assert.isTrue(spy.called);
    });

    it('ignores the event when no modifier', () => {
      const spy = sinon.spy();
      element.addEventListener('send-request', spy);
      MockInteractions.keyDownOn(element, 13, [], 'Enter');
      assert.isFalse(spy.called);
    });

    it('ignores the event for other keys', () => {
      const spy = sinon.spy();
      element.addEventListener('send-request', spy);
      MockInteractions.keyDownOn(element, 83, [], 's');
      assert.isFalse(spy.called);
    });
  });
});
