import { Color, DoubleSide, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, ShaderMaterial, Vector2 } from "three";
import { Canvas, CanvasConstructor } from "../webgl/canvas";
import { Util } from "../libs/util";
import { Func } from "../core/func";
import { Capture } from "../webgl/capture";
import { ImgEffectShader } from "../glsl/imgEffectShader";
import { TexLoader } from "../webgl/texLoader";

export class ImgEffect extends Canvas {
  private _con: Object3D
  // private _mesh: Array<Points> = []
  private _mesh2: Array<Mesh> = []

  // ベース映像作成用
  private _blockCon: Object3D
  // private _logo: Mesh

  private _texNum:number = Func.val(50, 100)
  private _cap: Array<Capture> = []
  private _renderCnt: number = 0

  constructor(opt: CanvasConstructor) {
    super(opt)

    this._con = new Object3D()
    this.mainScene.add(this._con)

    this._blockCon = new Object3D()

    for(let i = 0; i < 1; i++) {
      const logo = new Mesh(
        new PlaneGeometry(1, 1),
        new MeshBasicMaterial({
          map: TexLoader.instance.get('./assets/sample.png'),
          transparent: true,
          side: DoubleSide,
        })
      )
      this._blockCon.add(logo)
      logo.position.set(0, 0, i * -20)
    }

    for(let i = 0; i < this._texNum; i++) {
      this._cap.push(new Capture())
    }

    this._renderCnt = 0
    this._makeMesh()
    this._resize()
  }


  private _makeMesh(): void {
    for(let i = 0; i < this._texNum; i++) {
      const m = new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
          vertexShader:ImgEffectShader.vertexShader,
          fragmentShader:ImgEffectShader.fragmentShader,
          transparent:true,
          uniforms:{
            range:{value:new Vector2(i * (1 / this._texNum), (i + 1) * (1 / this._texNum))},
            col:{value:new Color(0x000000).offsetHSL(Util.map(i, 0, 2, 0, this._texNum - 1), 1, 0.5)},
            time:{value:0},
            tex:{value:this._cap[(i + this._renderCnt) % this._texNum].texture()},
          }
        })
      )
      this._con.add(m)
      this._mesh2.push(m)
    }
  }


  protected _update(): void {
    super._update()

    const logoScale = Math.min(Func.sw(), Func.sh()) * Util.map(Math.cos(this._c * 0.1), 1, 2, -1, 1)
    this._blockCon.scale.set(logoScale, logoScale, 1)
    this._blockCon.position.x = Math.sin(this._c * 0.05) * (logoScale * Func.val(0.5, 0.5))
    // this._logo.position.x = Math.sin(this._c * 0.05) * Func.sw() * 0.25
    // this._blockCon.rotation.x += 0.025
    // this._blockCon.rotation.y += 0.025

    this._mesh2.forEach((m:any, i:number) => {
      const s = Math.max(this.renderSize.width, this.renderSize.height) * 1
      m.scale.set(s, s, 1)
      this._setUni(m, 'col', new Color(0x000000).offsetHSL(this._c * 2 - Util.map(i, 0, 2, 0, this._texNum - 1), 1, 0.5))
      this._setUni(m, 'time', this._c)
      this._setUni(m, 'tex', this._cap[(((this._texNum - 1) - i) + this._renderCnt) % this._texNum].texture())
    })

    this._con.add(this._blockCon)

    // ベース映像のレンダリング
    if(this._c % 1 == 0) {
      const cap = this._cap[this._renderCnt % this._texNum]
      cap.add(this._blockCon)

      this.renderer.setClearColor(0x000000, 1)
      cap.render(this.renderer, this.cameraPers)
      if(this._c % 1 == 0) this._renderCnt++
    }

    this.renderer.setClearColor(0x000000, 1)
    this.renderer.render(this.mainScene, this.cameraPers)
  }


  protected _resize(): void {
    super._resize()

    const w = Func.sw()
    const h = Func.sh()

    this.renderSize.width = w
    this.renderSize.height = h

    let pixelRatio: number = window.devicePixelRatio || 1
    this._cap.forEach((c:Capture) => {
      c.setSize(w * 1, h * 1, pixelRatio)
    })

    this.cameraPers.fov = 90

    this._updateOrthCamera(this.cameraOrth, w, h)
    this._updatePersCamera(this.cameraPers, w, h)

    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(w, h)
    // this.renderer.clear()
  }
}
