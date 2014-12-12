var DEMO =
{
	ms_Renderer : null,
	ms_Camera : null,
	ms_Scene : null,
	ms_Controls : null,
	ms_Ocean : null,

	Initialize : function () {

		this.ms_Renderer = new THREE.WebGLRenderer();
		this.ms_Renderer.context.getExtension( 'OES_texture_float' );
		this.ms_Renderer.context.getExtension( 'OES_texture_float_linear' );

		document.body.appendChild( this.ms_Renderer.domElement );

		this.ms_Scene = new THREE.Scene();

		this.ms_Camera = new THREE.PerspectiveCamera( 55.0, WINDOW.ms_Width / WINDOW.ms_Height, 0.5, 300000 );
		this.ms_Camera.position.set( 450, 350, 450 );
		this.ms_Camera.lookAt( new THREE.Vector3() );
		this.ms_Scene.add( this.ms_Camera );
		
		// Initialize Orbit control		
		this.ms_Controls = new THREE.OrbitControls( this.ms_Camera, this.ms_Renderer.domElement );
		this.ms_Controls.userPan = false;
		this.ms_Controls.userPanSpeed = 0.0;
		this.ms_Controls.minDistance = 0;
		this.ms_Controls.maxDistance = 2000.0;
		this.ms_Controls.minPolarAngle = 0;
		this.ms_Controls.maxPolarAngle = Math.PI * 0.495;
		
		this.InitializeScene();
		
		this.InitGui();
		
	},
	
	InitializeScene : function InitializeScene() {
		
		// Add light
		var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
		directionalLight.position.set( 0, 1, 1 );
		this.ms_Scene.add( directionalLight );
		
		// Add Black Pearl
		var loader = new THREE.OBJMTLLoader();
		this.ms_BlackPearl = null;
		loader.load( 'models/BlackPearl/BlackPearl.obj', 'models/BlackPearl/BlackPearl.mtl', function ( object ) {
			object.position.y = 20.0;
			if( object.children ) {
				for( child in object.children ) {
					object.children[child].material.side = THREE.DoubleSide;
				}
			}
			
			DEMO.ms_Scene.add( object );
			DEMO.ms_BlackPearl = object;
		} );
		
		// Add rain
		{
			var rainMaterial = new THREE.PointCloudMaterial( { size: 0.2, color: 0xaaaaaa } );
			this.ms_RainGeometry = new THREE.Geometry();
			var size = 100;
			for ( i = 0; i < 2000; i++ )
			{
				var vertex = new THREE.Vector3();
				vertex.x = Math.random() * 2.0 * size - size;
				vertex.y = Math.random() * 2.0 * size - size;
				vertex.z = Math.random() * size - size * 0.5;
				this.ms_RainGeometry.vertices.push( vertex );
			}
			this.ms_Rain = new THREE.PointCloud( this.ms_RainGeometry, rainMaterial );
			this.ms_Camera.add( this.ms_Rain );
			this.ms_Rain.position.setZ( - size * 0.75 ) ;
		}
		
		this.LoadSkyBox();
		
		// Initialize Clouds
		this.ms_CloudShader = new CloudShader( this.ms_Renderer );
		this.ms_CloudShader.cloudMesh.scale.multiplyScalar( 3 );
		this.ms_Scene.add( this.ms_CloudShader.cloudMesh );
		
		// Initialize Ocean
		var gsize = 512; 
		var res = 512; 
		var gres = res;
		var origx = -gsize / 2;
		var origz = -gsize / 2;
		this.ms_Ocean = new THREE.Ocean( this.ms_Renderer, this.ms_Camera, this.ms_Scene,
		{
			INITIAL_SIZE : 200.0,
			INITIAL_WIND : [ 10.0, 10.0 ],
			INITIAL_CHOPPINESS : 1.8,
			CLEAR_COLOR : [ 1.0, 1.0, 1.0, 0.0 ],
			SUN_DIRECTION : [ -1.0, 1.0, 1.0 ],
			OCEAN_COLOR: new THREE.Vector3( 0.004, 0.016, 0.047 ),
			SKY_COLOR: new THREE.Vector3( 10.0, 13.0, 15.0 ),
			EXPOSURE : 0.25,
			GEOMETRY_RESOLUTION: gres,
			GEOMETRY_SIZE : gsize,
			RESOLUTION : res
		} );
		this.ms_Ocean.materialOcean.uniforms.u_projectionMatrix = { type: "m4", value: this.ms_Camera.projectionMatrix };
		this.ms_Ocean.materialOcean.uniforms.u_viewMatrix = { type: "m4", value: this.ms_Camera.matrixWorldInverse };
		this.ms_Ocean.materialOcean.uniforms.u_cameraPosition = { type: "v3", value: this.ms_Camera.position };
		this.ms_Scene.add( this.ms_Ocean.oceanMesh );
		
	},
	
	InitGui : function InitGui() {
		// Initialize UI
		var gui = new dat.GUI();
		gui.add( this.ms_Ocean, "size", 10, 5000 ).onChange( function( v ) {
			this.object.size = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "choppiness", 0.1, 4 ).onChange( function ( v ) {
			this.object.choppiness = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "windX", -15, 15 ).onChange( function ( v ) {
			this.object.windX = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "windY", -15, 15 ).onChange( function ( v ) {
			this.object.windY = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "sunDirectionX", -1.0, 1.0 ).onChange( function ( v ) {
			this.object.sunDirectionX = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "sunDirectionY", -1.0, 1.0 ).onChange( function ( v ) {
			this.object.sunDirectionY = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "sunDirectionZ", -1.0, 1.0 ).onChange( function ( v ) {
			this.object.sunDirectionZ = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "exposure", 0.0, 0.5 ).onChange( function ( v ) {
			this.object.exposure = v;
			this.object.changed = true;
		} );
	},

	LoadSkyBox : function LoadSkyBox() {
		var aCubeMap = THREE.ImageUtils.loadTextureCube( [
			//*
			'img/grimmnight_west.jpg',
			'img/grimmnight_east.jpg',
			'img/grimmnight_up.jpg',
			'img/grimmnight_down.jpg',
			'img/grimmnight_south.jpg',
			'img/grimmnight_north.jpg',
			/*/
			'img/px.jpg',
			'img/nx.jpg',
			'img/py.jpg',
			'img/ny.jpg',
			'img/pz.jpg',
			'img/nz.jpg',
			//*/
			/*
			'img/skybox_0.jpg',
			'img/skybox_1.jpg',
			'img/skybox_2.jpg',
			'img/skybox_3.jpg',
			'img/skybox_4.jpg',
			'img/skybox_5.jpg',
			//*/

		] );
		aCubeMap.format = THREE.RGBFormat;

		var aShader = THREE.ShaderLib['cube'];
		aShader.uniforms['tCube'].value = aCubeMap;

		var aSkyBoxMaterial = new THREE.ShaderMaterial( {
		  fragmentShader: aShader.fragmentShader,
		  vertexShader: aShader.vertexShader,
		  uniforms: aShader.uniforms,
		  depthWrite: false,
		  side: THREE.BackSide
		} );

		var aSkybox = new THREE.Mesh(
		  new THREE.BoxGeometry( 100000, 100000, 100000 ),
		  aSkyBoxMaterial
		);
		
		this.ms_Scene.add( aSkybox );
		
	},
	
	Display : function () {
	
		this.ms_Renderer.render( this.ms_Scene, this.ms_Camera );
		
	},

	Update : function () {
	
		var currentTime = new Date().getTime();
		this.ms_Ocean.deltaTime = ( currentTime - lastTime ) / 1000 || 0.0;
		lastTime = currentTime;
		
		// Update black ship
		if( this.ms_BlackPearl !== null )
		{
			this.ms_BlackPearl.rotation.y = Math.cos( currentTime * 0.0008 ) * 0.05 - 0.025;
			this.ms_BlackPearl.rotation.x = Math.sin( currentTime * 0.001154 + 0.78 ) * 0.1 + 0.05;
		}
		
		// Update rain
		var seed = 1;
		var fastRandom = function fastRandom() {
			// https://stackoverflow.com/questions/521295/javascript-random-seeds
			var x = Math.sin( seed++ ) * 10000;
			return x - Math.floor( x );
		}
		for( i in this.ms_RainGeometry.vertices )
		{
			var speed = 2.0;
			this.ms_RainGeometry.vertices[i].y -= fastRandom() * speed + speed;
			if( this.ms_RainGeometry.vertices[i].y < -50 )
				this.ms_RainGeometry.vertices[i].y = 50;
		}
		this.ms_Rain.rotation.set( -this.ms_Camera.rotation.x, -this.ms_Camera.rotation.y, -this.ms_Camera.rotation.z, "ZYX" );
		this.ms_RainGeometry.verticesNeedUpdate = true;
		
		// Render ocean reflection
		this.ms_Camera.remove( this.ms_Rain );
		this.ms_Ocean.render( this.ms_Ocean.deltaTime );
		this.ms_Camera.add( this.ms_Rain );
		
		this.ms_CloudShader.update();
		this.ms_Ocean.overrideMaterial = this.ms_Ocean.materialOcean;
		if ( this.ms_Ocean.changed ) {
			this.ms_Ocean.materialOcean.uniforms.u_size.value = this.ms_Ocean.size;
			this.ms_Ocean.materialOcean.uniforms.u_sunDirection.value.set( this.ms_Ocean.sunDirectionX, this.ms_Ocean.sunDirectionY, this.ms_Ocean.sunDirectionZ );
			this.ms_Ocean.materialOcean.uniforms.u_exposure.value = this.ms_Ocean.exposure;
			this.ms_Ocean.changed = false;
		}
		this.ms_Ocean.materialOcean.uniforms.u_normalMap.value = this.ms_Ocean.normalMapFramebuffer ;
		this.ms_Ocean.materialOcean.uniforms.u_displacementMap.value = this.ms_Ocean.displacementMapFramebuffer ;
		this.ms_Ocean.materialOcean.uniforms.u_projectionMatrix.value = this.ms_Camera.projectionMatrix ;
		this.ms_Ocean.materialOcean.uniforms.u_viewMatrix.value = this.ms_Camera.matrixWorldInverse ;
		this.ms_Ocean.materialOcean.uniforms.u_cameraPosition.value = this.ms_Camera.position;
		this.ms_Ocean.materialOcean.depthTest = true;
		this.ms_Controls.update();
		this.Display();
		
	},

	Resize : function ( inWidth, inHeight ) {
	
		this.ms_Camera.aspect = inWidth / inHeight;
		this.ms_Camera.updateProjectionMatrix();
		this.ms_Renderer.setSize( inWidth, inHeight );
		this.Display();
		
	}
};