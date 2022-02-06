import { Box, Text, TextField, Image, Button } from '@skynexui/components';
import React from 'react';
import appConfig from '../config.json';
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { ButtonSendSticker } from '../src/components/ButtonSendSticker'

export default function ChatPage() {
    const roteamento = useRouter();
    const username = roteamento.query.username;

    // Sua lógica vai aqui
    const [message, setMessage] = React.useState('');
    const [messageList, setMessageList] = React.useState([]);


    const [messagesLoaded, setMessagesLoaded] = React.useState(false);
    const [messageSent, setMessageSent] = React.useState(true);

    // Database Logic
    const SUPA_BASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0Mzg5NDgwMSwiZXhwIjoxOTU5NDcwODAxfQ.WVBMx9TN8fS_mCo7tR3Rrv80fruyShPGJZGXlKRkpDE"
    const SUPA_BASE_URL = "https://nxzgqmtkwgoeggmrstfg.supabase.co";
    const supabase = createClient(SUPA_BASE_URL, SUPA_BASE_ANON_KEY);

    // Puxa as mensagens do servidor
    function puxaMensagens() {
        supabase.from('mensagens')
            .select('*')
            .order('id', { ascending: false })
            .then(({ data }) => {
                console.log('puxado', data.length, 'mensagens')
                setMessagesLoaded(true)
                setMessageList(data)
            })
    }

    function OuvePorNovasMensagens(oldMessages) {
        supabase
        .from('mensagens')
        .on('INSERT', (mensagensInseridas) => {
            puxaMensagens();
        }).subscribe()
    }

    React.useEffect(
        function () {
            console.log('puxando mensagens do servidor');
            setMessagesLoaded(false);
            puxaMensagens();

            OuvePorNovasMensagens()
        }, [])


    function insertMessage(ev) {
        setMessage(ev.target.value);
    }

    function handleMessage(mensagemAEnviar) {
            if (mensagemAEnviar == '')
                return

            let objMessage = {
                // id: messageList.length + 2,
                de: username,
                texto: mensagemAEnviar,
            }
            // Previne envio múltiplo
            setMessage('');
            setMessageSent(false);

            //Faz um novo insert do objeto mensagem no banco de dados
            supabase.from('mensagens')
                .insert([
                    objMessage
                ])
                .then(({ data }) => {
                    console.log('enviado ', data[0].texto)
                    setMessageSent(true)
                    /* 
                    setMessageList([
                        data[0],
                        ...messageList
                    ]); */
                })
    }

    // ./Sua lógica vai aqui
    return (

        <Box
            styleSheet={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: appConfig.theme.colors.primary[500],
                backgroundImage: `url(https://virtualbackgrounds.site/wp-content/uploads/2020/08/the-matrix-digital-rain.jpg)`,
                backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundBlendMode: 'multiply',
                color: appConfig.theme.colors.neutrals['000']
            }}
        >
            <Box
                styleSheet={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    boxShadow: '0 2px 10px 0 rgb(0 0 0 / 20%)',
                    borderRadius: '5px',
                    backgroundColor: appConfig.theme.colors.neutrals[700],
                    height: '100%',
                    maxWidth: '95%',
                    maxHeight: '95vh',
                    padding: {
                        xs: '5px',
                        sm: '32px'
                    }
                }}
            >
                <Header />
                <Box
                    styleSheet={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'end',
                        flex: 1,
                        height: '80%',
                        backgroundColor: appConfig.theme.colors.neutrals[600],
                        flexDirection: 'column',
                        borderRadius: '5px',
                        padding: '16px',
                    }}
                >
                    <MessageList messagesList={messageList} />

                    {/* Mensagem de status */}
                    <Text tag="span">
                        {(!messagesLoaded) ? <Loading text="Carregando Mensagens" /> : null}
                        {(!messageSent) ? <Loading text="Enviando" /> : null}
                    </Text>

                    <Box
                        as="form"
                        styleSheet={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <ButtonSendSticker 
                        onStickerClick={ (stickerURL) => {
                            handleMessage(`:sticker:${stickerURL}`)
                        }}/>
                        <TextField
                            placeholder="Insira sua mensagem aqui..."
                            value={message}
                            data-username="isjacrod"
                            type="textarea"
                            styleSheet={{
                                display: 'flex',
                                width: '100%',
                                border: '0',
                                resize: 'none',
                                borderRadius: '5px',
                                padding: '6px 8px',
                                backgroundColor: appConfig.theme.colors.neutrals[800],
                                marginRight: '12px',
                                color: appConfig.theme.colors.neutrals[200],
                            }}
                            onChange={insertMessage}
                            onKeyPress={ (ev) => {
                                if (ev.key == 'Enter' && (!ev.shiftKey)) {
                                    ev.preventDefault();
                                    handleMessage(message);
                                }
                            }}
                        />
                        <Button type='submit'
                            label='Send'
                            size='sm'
                            buttonColors={{
                                contrastColor: appConfig.theme.colors.neutrals["000"],
                                mainColor: appConfig.theme.colors.primary[500],
                                mainColorLight: appConfig.theme.colors.primary[400],
                                mainColorStrong: appConfig.theme.colors.primary[600],
                            }}
                            onClick={ (ev) => {
                                ev.preventDefault();
                                handleMessage(message);
                            }}
                        />
                    </Box>

                </Box>
            </Box>
        </Box>
    )
}

function Header() {
    return (
        <>
            <Box styleSheet={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
                <Text variant='heading5'>
                    Chat
                </Text>
                <Button
                    variant='tertiary'
                    colorVariant='neutral'
                    label='Logout'
                    href="/"
                />
            </Box>
        </>
    )
}

function MessageList(props) {
    return (
        <Box
            tag="ul"
            styleSheet={{
                overflow: 'scroll',
                display: 'flex',
                flexDirection: 'column-reverse',
                flex: 1,
                color: appConfig.theme.colors.neutrals["000"],
                marginBottom: '16px',
            }}
        >
            { // Renderiza cada mensagem da lista
                props.messagesList.map(
                    function (mensagem) {
                        return (
                            <Baloon messageObject={mensagem}>
                                <Text
                                    styleSheet={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        color: appConfig.theme.colors.neutrals['000'],
                                    }}
                                >
                                    <Box
                                        styleSheet={{
                                            display: 'flex',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <Image
                                            styleSheet={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                marginRight: '8px',
                                            }}
                                            src={`https://github.com/${mensagem.de}.png`}
                                        />
                                        <Text tag="strong">
                                            {mensagem.de}
                                        </Text>
                                        <Text
                                            styleSheet={{
                                                fontSize: '10px',
                                                marginLeft: '8px',
                                                color: appConfig.theme.colors.neutrals[300],
                                            }}
                                            tag="span"
                                        >

                                        </Text>
                                    </Box>
                                    {mensagem.texto.startsWith(':sticker:') ?
                                        <StickerContainer src={mensagem.texto.replace(':sticker:','')}/>
                                        : <Text>{mensagem.texto}</Text>
                                    }
                                    <Text
                                        styleSheet={{
                                            alignSelf: 'end',
                                            fontSize: '0.5em',
                                            hover: {
                                                fontSize: '1em',
                                            }
                                        }}
                                    >
                                        {(new Date().toLocaleDateString())}
                                    </Text>
                                </Text>
                            </Baloon>
                        )
                    }
                )
            }
        </Box>
    )
}

function StickerContainer(props) {
    const URL=props.src;
    return (
        <Image src={URL} 
            styleSheet={{
                width: '15%',
                height: '15%',
            }}
        />
    )
}

function Baloon(props) {
    const mensagem = props.messageObject;
    return(
    <div 
        key = { mensagem.id } 
        className={mensagem.de == 'isjacrod' ? 'left_aligned' : 'right_aligned'}>
        {props.children}
        <style jsx>{`
            div {
                box-shadow: inset 1px 1px 1px 1px;
                color: ${appConfig.theme.colors.primary['500']};
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 12px;
                width: 70%;
            }
            div:hover {
                background-color: ${appConfig.theme.colors.neutrals['700']};
            }
            .right_aligned {
                align-self: end;
                border-radius: 20px 20px 0px 20px;
            }
            .left_aligned {
                align-self: start;
                border-radius: 20px 20px 20px 0px;
            }
        `}</style>
    </div>
    )

}

class Loading extends React.Component {
    constructor(props) {
        super(props);
        this.text = props.text;
        this.state = { dots: '.' };
        this.addDots = this.addDots.bind(this)
    }

    render() {
        return (
            <Text>{this.text}{this.state.dots}</Text>
        );
    }

    addDots() {
        if (this.state.dots === '...')
            this.setState({ dots: '.' })
        else
            this.setState({ dots: (this.state.dots + '.') })
    }

    componentDidMount() {
        this.timer = setInterval(
            this.addDots, 500
        )
    }

    componentWillUnmount() {
        clearInterval(this.timer)
    }
}