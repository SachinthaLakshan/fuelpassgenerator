import React, { useState,useEffect  } from 'react';
import PDF from './PDF';

function Post () {
    const [file, setFile] = useState();
    const [postSubmitted, setSostSubmitted] = useState(false);
    const [qrUpoladed, setQrUpoladed] = useState(false);

    useEffect(() => {
        if(file){
            setQrUpoladed(true);
        }
      }, [file]);
   
    const handleChange=(e)=> {
        setFile(URL.createObjectURL(e.target.files[0]));
        
    }

    const Open = () => {
        document.getElementById('qr-uploader').click();
    }

    const GeneratePass = () => {
        setSostSubmitted(true);
    }
    
    const onGoBack=()=>{
        setSostSubmitted(false);
        setQrUpoladed(false);
    }

    
        return(
            <>
                {  !postSubmitted ? 
                    (<div className="container">
                        <div className="jumbotron mt-3">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="well well-sm">
                                        <form className="form-horizontal" method="post">
                                            <fieldset>
                                                <legend className="text-center header">Upload your QR Image</legend>
                                                <div className="form-group">
                                                <input type="file" id='qr-uploader' style={{ display: 'none' }} onChange={handleChange} accept=".jpg,.jpeg,.png"  />
                                                <button type="button" onClick={() => Open() } className="btn btn-primary btn-lg mb-4">Upload</button>
                                                </div>
                                                {qrUpoladed?<div className="form-group">
                                                    <button type="button" onClick={()=>GeneratePass()}  className="btn btn-success btn-lg">Generate fual pass</button>
                                                </div>:<></>}
                                            </fieldset>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            @Shan
                        </div>
                    </div>) : (
                        <PDF  image={file} onGoBack={onGoBack} />
                    )
                }
            </>
        );
    
}

export default Post;