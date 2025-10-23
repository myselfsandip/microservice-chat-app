import React from 'react'

const ChatHeader = () => {
    return (
        <>
            {/* Mobile Menu Toggle */}
            <div className="sm:hidden fixed top-4 right-4 z-30 ">
                <button className='p-3 bg-gray-800 rounded-lg'></button>
            </div>
        </>
    )
}

export default ChatHeader;