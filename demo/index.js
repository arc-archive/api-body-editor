import { html, render } from 'lit-html';
import { ApiDemoPageBase } from '@advanced-rest-client/arc-demo-helper/ApiDemoPage.js';
import { LitElement } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@api-components/api-navigation/api-navigation.js';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@anypoint-web-components/anypoint-styles/colors.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@polymer/paper-toast/paper-toast.js';
import '@api-components/api-headers-editor/api-headers-editor.js';
import '../api-body-editor.js';

class DemoElement extends AmfHelperMixin(LitElement) {}
window.customElements.define('demo-element', DemoElement);

class ApiDemo extends ApiDemoPageBase {
  constructor() {
    super();

    this.initObservableProperties([
      'mainReadOnly', 'mainDisabled', 'demoOutlined', 'demoLegacy',
      'narrow', 'allowCustom', 'noDocs', 'selectedBody', 'payloadResult',
      'allowHideOptional', 'allowDisableParams'
    ]);

    this.componentName = 'api-body-editor';
    this.demoStates = ['Filled', 'Outlined', 'Legacy'];
    this._mainDemoStateHandler = this._mainDemoStateHandler.bind(this);
    this._toggleMainOption = this._toggleMainOption.bind(this);
    this._modelHandler = this._modelHandler.bind(this);
    this._mainValueChanged = this._mainValueChanged.bind(this);

    window.addEventListener('content-type-changed', this._ctChanged.bind(this));
  }

  get helper() {
    if (!this.__helper) {
      this.__helper = document.getElementById('helper');
    }
    return this.__helper;
  }

  _navChanged(e) {
    const { selected, type } = e.detail;
    if (type === 'method') {
      this.setData(selected);
      this.hasData = true;
    } else {
      this.hasData = false;
    }
  }

  setData(selected) {
    const webApi = this.helper._computeWebApi(this.amf);
    const body = this.helper._computeMethodModel(webApi, selected);
    this.selectedBody = body;
  }

  _mainDemoStateHandler(e) {
    const state = e.detail.value;
    switch (state) {
      case 0:
        this.demoOutlined = false;
        this.demoLegacy = false;
        break;
      case 1:
        this.demoOutlined = true;
        this.demoLegacy = false;
        break;
      case 2:
        this.demoOutlined = false;
        this.demoLegacy = true;
        break;
    }
  }

  _toggleMainOption(e) {
    const { name, checked } = e.target;
    this[name] = checked;
  }

  _mainValueChanged(e) {
    const { value } = e.detail;
    if (value && value.forEach) {
      const log = [];
      value.forEach((value, name) => {
        let item = `${name}: `;
        if (value.name) {
          item += value.name;
        } else {
          item += value;
        }
        log[log.length] = item;
      });
      this.payloadResult = log.join('\n');
    } else {
      this.payloadResult = value;
    }
  }

  _modelHandler(e) {
    this.dataViewModel = e.detail.value;
  }

  _ctChanged(e) {
    const toast = document.getElementById('toast');
    toast.text = `Content type changed: ${e.detail.value}`;
    toast.opened = true;
  }

  _demoTemplate() {
    const {
      mainReadOnly,
      mainDisabled,
      demoStates,
      darkThemeActive,
      demoOutlined,
      demoLegacy,
      selectedBody,
      payloadResult,
      amf,
      allowHideOptional,
      allowDisableParams,
      allowCustom,
      noDocs
    } = this;
    return html`<section role="main" class="documentation-section">
      <h2>API model demo</h2>
      <p>
        This demo lets you preview the API URL parameters editor element with various
        configuration options.
      </p>

      <section class="horizontal-section-container centered main">
        ${this._apiNavigationTemplate()}
        <div class="demo-container">
          <arc-interactive-demo
            .states="${demoStates}"
            @state-chanegd="${this._mainDemoStateHandler}"
            ?dark="${darkThemeActive}"
          >

            <api-body-editor
              slot="content"
              ?readonly="${mainReadOnly}"
              ?disabled="${mainDisabled}"
              ?outlined="${demoOutlined}"
              ?legacy="${demoLegacy}"
              .amf="${amf}"
              .amfBody="${selectedBody}"
              .allowHideOptional="${allowHideOptional}"
              .allowDisableParams="${allowDisableParams}"
              .allowCustom="${allowCustom}"
              .noDocs="${noDocs}"
              @value-changed="${this._mainValueChanged}"
              @model-changed="${this._modelHandler}"></api-body-editor>

            <label slot="options" id="mainOptionsLabel">Options</label>

            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="mainReadOnly"
              @change="${this._toggleMainOption}"
              >Read only</anypoint-checkbox
            >
            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="mainDisabled"
              @change="${this._toggleMainOption}"
              >Disabled</anypoint-checkbox
            >
            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="narrow"
              @change="${this._toggleMainOption}"
              >Narrow view</anypoint-checkbox
            >
            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="noDocs"
              @change="${this._toggleMainOption}"
              >No docs</anypoint-checkbox
            >
            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="allowCustom"
              @change="${this._toggleMainOption}"
              >Allow custom</anypoint-checkbox
            >
            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="allowDisableParams"
              @change="${this._toggleMainOption}"
              >Allow disable</anypoint-checkbox
            >
            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="allowHideOptional"
              @change="${this._toggleMainOption}"
              >Allow optional</anypoint-checkbox
            >
          </arc-interactive-demo>
        </div>
      </section>

      <section>
        <h3>Generated data</h3>
        <output>
${payloadResult ? payloadResult : 'Value not ready'}
        </output>
      </section>

      <section>
        <h3>Request headers editor</h3>
        <p>Notice that content type change in one element updates state in the other.</p>
        <api-headers-editor
          allowhideoptional
          allowdisableparams
          allowcustom></api-headers-editor>
      </section>
    </section>`;
  }

  _apiListTemplate() {
    return html`
    <paper-item data-src="demo-api.json">Demo API</paper-item>
    <paper-item data-src="demo-api-compact.json">Demo API - compact</paper-item>
    <paper-item data-src="examples-api.json">Examples render demo api</paper-item>
    <paper-item data-src="examples-api-compact.json">Examples render demo - compact model</paper-item>
    <paper-item data-src="apic-169.json">apic-169</paper-item>
    <paper-item data-src="apic-169-compact.json">apic-169 - compact model</paper-item>`;
  }

  _render() {
    const {
      amf
    } = this;
    render(html`
      ${this.headerTemplate()}

      <demo-element id="helper" .amf="${amf}"></demo-element>
      <paper-toast id="toast"></paper-toast>

      ${this._demoTemplate()}
      `, document.querySelector('#demo'));
  }
}
const instance = new ApiDemo();
instance.render();
window.demoInstance = instance;
